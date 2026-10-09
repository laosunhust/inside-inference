"""Optional CUDA execution with actual VRAM K/V and pinned-DRAM offload; no fallback."""
from time import perf_counter_ns
import torch

from inside_inference.declarations_generated import KVState
from inside_inference.kv_runtime import ReferenceRuntime, prefix_state
from inside_inference.model import identity, shape
from inside_inference.tensor_model import TensorModel


class CudaRuntime(ReferenceRuntime):
    def __init__(self, checkpoint):
        if not torch.cuda.is_available():
            raise ValueError('CUDA backend requested but CUDA is unavailable; use the CUDA environment')
        super().__init__(checkpoint)
        self.tensor_model=TensorModel(checkpoint).to('cuda').eval()
        self.gpu,self.pinned_host={},{}
        torch.cuda.synchronize()

    @torch.no_grad()
    def compute(self,ids,state,**trace):
        key=identity(state.to_dict())
        if state.token_ids and key not in self.gpu:
            raise ValueError('CUDA computation requires VRAM-resident K/V')
        cached=self.gpu.get(key)
        torch.cuda.synchronize();before=perf_counter_ns()
        result=self.tensor_model.execute(torch.tensor([ids],dtype=torch.long,device='cuda'),cached,capture=trace['capture'])
        keys=result['keys'][0].cpu().tolist();values=result['values'][0].cpu().tolist()
        new_state=KVState(checkpoint_sha256=self.model.sha256,
            tokenizer_sha256=self.model.checkpoint['manifest_sha256'],
            token_ids=tuple(state.token_ids)+tuple(ids),keys=tuple(map(tuple,keys)),values=tuple(map(tuple,values)))
        new_id=identity(new_state.to_dict())
        self.gpu[new_id]=(result['keys'],result['values']);self.device[new_id]=new_state
        nodes=[];prefix=(trace.get('work_id') or f"{trace['run_id']}/step-{trace['step']}")+'/'
        for raw in result['observations']:
            value=raw['values'][0].cpu().tolist();name=raw['name']
            inputs=[('state:'+key if i=='state:input' else i) for i in raw['inputs']]
            nodes.append(dict(id=prefix+name,name=name,term=raw['term'],layer=raw['layer'],
                request_id=trace['request_id'],run_id=trace['run_id'],step=trace['step'],
                positions=raw['positions'],shape=shape(value),
                dtype='bool' if name=='causal_mask' else 'int' if name=='input_ids' else 'binary64',
                inputs=[i if i.startswith(('parameter:','state:')) else prefix+i for i in inputs],
                formula=raw['formula'],axes=raw['axes'],values=value))
        logits=result['logits'][0].cpu().tolist()
        torch.cuda.synchronize();elapsed=(perf_counter_ns()-before)/1000
        return dict(logits=logits,nodes=nodes,state=new_state),elapsed

    def describe(self):
        return dict(compute_device=torch.cuda.get_device_name(), device_state_storage='CUDA VRAM tensors',
            host_state_storage='Pinned DRAM tensors; inspection snapshots are separate',
            library='PyTorch '+str(torch.__version__)+'; CUDA '+str(torch.version.cuda), precision='binary64')

    def retain(self,state,count):
        source=identity(state.to_dict())
        if source not in self.gpu:raise ValueError('Retention requires VRAM-resident producer')
        torch.cuda.synchronize();before=perf_counter_ns()
        prefix=prefix_state(state,count);key=identity(prefix.to_dict())
        self.gpu[key]=tuple(t[:,:count].clone() for t in self.gpu[source])
        self.device[key]=prefix
        torch.cuda.synchronize()
        return prefix,(perf_counter_ns()-before)/1000

    def transfer(self,state_id,to_host):
        torch.cuda.synchronize()
        if to_host:
            if state_id not in self.gpu:raise ValueError('Offload requires VRAM source')
            source=self.gpu[state_id]
            destination=tuple(torch.empty(t.shape,dtype=t.dtype,device='cpu',pin_memory=True) for t in source)
        else:
            if state_id not in self.pinned_host:raise ValueError('Retrieval requires pinned DRAM source')
            source=self.pinned_host[state_id]
            destination=tuple(torch.empty(t.shape,dtype=t.dtype,device='cuda') for t in source)
        # Allocation is outside this transfer measurement; copies + completion are inside.
        before=perf_counter_ns()
        for target,tensor in zip(destination,source):target.copy_(tensor,non_blocking=True)
        torch.cuda.synchronize();elapsed=(perf_counter_ns()-before)/1000
        if to_host:
            self.pinned_host[state_id]=destination;del self.gpu[state_id]
            self.host[state_id]=self.device.pop(state_id)
        else:
            self.gpu[state_id]=destination;del self.pinned_host[state_id]
            self.device[state_id]=self.host.pop(state_id)
        return elapsed

    def collect(self,device_ids,host_ids):
        super().collect(device_ids,host_ids)
        for pool,live in ((self.gpu,device_ids),(self.pinned_host,host_ids)):
            for key in list(pool):
                if key not in live:del pool[key]

    def close(self):
        self.gpu.clear();self.pinned_host.clear();super().close()
