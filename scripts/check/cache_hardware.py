"""Bounded local DRAM/VRAM transfer evidence; no inferred accelerator equivalence."""
import json
from pathlib import Path
import resource
import statistics
import subprocess
import hashlib
from datetime import datetime, timezone
import torch

from inside_inference.cuda_runtime import CudaRuntime
from inside_inference.model import initialize,ModelArchitecture,identity,canonical
from inside_inference.tokenizer import Tokenizer
from inside_inference.cache_lab import source_identity
from scripts import ROOT


def swap_bytes():
    for line in Path('/proc/self/status').read_text().splitlines():
        if line.startswith('VmSwap:'):return int(line.split()[1])*1024
    raise RuntimeError('Process swap observation unavailable')


def main():
    output=ROOT/'out/experiments/kv-cache/hardware.json';output.parent.mkdir(parents=True,exist_ok=True)
    output.write_bytes(canonical({'passed':False,'status':'running'}))
    if not torch.cuda.is_available():raise RuntimeError('CUDA is required; no fallback')
    torch.cuda.init();torch.cuda.reset_peak_memory_stats()
    before_swap=swap_bytes();rows=[]
    checkpoint=initialize(ModelArchitecture(),Tokenizer().manifest_sha256)
    for count in (4,32,120):
        runtime=CudaRuntime(checkpoint)
        try:
            result,_=runtime.compute([0,3]+[42]*(count-2),runtime.empty(),capture=False,request_id='transfer-probe',run_id='transfer-probe',step=0)
            key=identity(result['state'].to_dict());original=tuple(t.clone() for t in runtime.gpu[key])
            samples={'device-to-host':[],'host-to-device':[]}
            for iteration in range(7):
                down=runtime.transfer(key,True)
                if not all(t.is_pinned() for t in runtime.pinned_host[key]):raise AssertionError('Host payload is not pinned')
                up=runtime.transfer(key,False)
                if not all(torch.equal(a,b) for a,b in zip(original,runtime.gpu[key])):raise AssertionError('Transfer changed payload')
                if iteration>=2:samples['device-to-host'].append(down);samples['host-to-device'].append(up)
            rows.append({'positions':count,'payload_bytes':count*checkpoint['config']['width']*16,
                'samples_us':samples,'median_us':{k:statistics.median(v) for k,v in samples.items()}})
            backend=runtime.describe()
        finally:runtime.close()
    report={'passed':True,'scope':'synchronized two-tensor K/V copies; allocations excluded; two warmups then five samples; no other-device prediction',
        'observed_at':datetime.now(timezone.utc).isoformat(),
        'source_sha256':source_identity(),'probe_source_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'architecture':checkpoint['config'],'initialization':checkpoint['provenance'],
        'backend':backend,'checkpoint_sha256':identity(checkpoint),'rows':rows,
        'process_swap_before_bytes':before_swap,'process_swap_after_bytes':swap_bytes(),
        'peak_process_rss_bytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1024,
        'peak_cuda_allocated_bytes':torch.cuda.max_memory_allocated(),'peak_cuda_reserved_bytes':torch.cuda.max_memory_reserved(),
        'gpu_inventory':subprocess.check_output(['nvidia-smi','--query-gpu=name,memory.total,memory.used,memory.free,driver_version','--format=csv'],text=True)}
    if report['process_swap_before_bytes'] or report['process_swap_after_bytes']:
        raise AssertionError('Process swap was observed; no-SSD measurement not established')
    output.write_bytes(canonical(report)+b'\n');print(json.dumps(report,indent=2))


if __name__=='__main__':main()
