"""Optional explicit PyTorch transcription; CPU training and CUDA inspection share equations."""
from inside_inference.declarations_generated import operation_for
from copy import deepcopy
import math
import torch
from torch import nn
from inside_inference.model import Model


class TensorModel(nn.Module):
    def __init__(self, checkpoint):
        super().__init__()
        reference=Model(checkpoint)
        self.template=deepcopy(reference.checkpoint);self.config=reference.config
        self.weights=nn.ParameterDict({name:nn.Parameter(torch.tensor(value,dtype=torch.float64))
                                      for name,value in reference.parameters.items()})

    def forward(self, ids):
        return self.execute(ids)['logits']

    def execute(self, ids, cached=None, capture=False):
        if ids.ndim!=2 or ids.dtype!=torch.long or not 0<ids.shape[1]<=self.config.context:
            raise ValueError('Expected batch of 1..context token IDs')
        if ids.shape[0]==0 or torch.any(ids<0) or torch.any(ids>=self.config.vocabulary):
            raise ValueError('Forward requires a nonempty batch of valid vocabulary IDs')
        p,c=self.weights,self.config
        offset=0 if cached is None else cached[0].shape[1]
        total=offset+ids.shape[1]
        if total>c.context:raise ValueError('Cached sequence exceeds context')
        observations=[]
        def observe(name,value,inputs,formula,layer=0,axes=None,positions=None):
            operation=operation_for(name)
            if capture:
                observations.append(dict(operation=operation,values=value,inputs=inputs,formula=formula,
                    layer=layer,axes=axes or ['position','channel'],
                    positions=list(range(offset,total)) if positions is None else positions))
            return value
        def dense(x,name,source):
            return observe(name,x@p[name]+p[name+'_bias'],[source,'parameter:'+name,'parameter:'+name+'_bias'],'X @ W + bias')
        def norm(x,name,source):
            layer=None if name=='ln_final' else 0
            mean=observe(name+'_mean',x.mean(dim=-1,keepdim=True),[source],'mean(X, channels)',layer=layer)
            variance=observe(name+'_variance',((x-mean)**2).mean(dim=-1,keepdim=True),[source,name+'_mean'],'mean((X - mean)^2, channels)',layer=layer)
            return observe(name,(x-mean)/torch.sqrt(variance+c.epsilon)*p[name+'_scale']+p[name+'_bias'],
                [source,name+'_mean',name+'_variance','parameter:'+name+'_scale','parameter:'+name+'_bias'],
                '(X - mean) / sqrt(variance + epsilon) * scale + bias',layer=layer)
        observe('input_ids',ids,[],'IDs supplied to this forward pass',layer=None,axes=['position'])
        token=observe('token_embedding',p['token_embedding'][ids],['input_ids','parameter:token_embedding'],'E[token_id]',layer=None)
        position=observe('position_embedding',p['position_embedding'][offset:total].unsqueeze(0).expand(ids.shape[0],-1,-1),['parameter:position_embedding'],'P[absolute_position]',layer=None)
        x=observe('embedding',token+position,['token_embedding','position_embedding'],'token embedding + position embedding',layer=None)
        normalized=norm(x,'ln1','embedding')
        q,k,v=(dense(normalized,name,'ln1') for name in ('query','key','value'))
        if cached is not None:k,v=torch.cat((cached[0],k),dim=1),torch.cat((cached[1],v),dim=1)
        k=observe('retained_keys',k,['state:input','key'],'concatenate(cached K, new K)',positions=list(range(total)))
        v=observe('retained_values',v,['state:input','value'],'concatenate(cached V, new V)',positions=list(range(total)))
        scores=observe('scores',q@k.transpose(-1,-2)/math.sqrt(c.width),['query','retained_keys'],'Q @ K^T / sqrt(width)',axes=['query position','key position'])
        allowed=torch.arange(total,device=ids.device)[None,:]<=torch.arange(offset,total,device=ids.device)[:,None]
        observe('causal_mask',allowed.unsqueeze(0).expand(ids.shape[0],-1,-1),['input_ids'],'key_position <= query_position',axes=['query position','key position'])
        attention=observe('attention',torch.softmax(scores.masked_fill(~allowed,-torch.inf),dim=-1),['scores','causal_mask'],'softmax(scores where allowed; -infinity elsewhere)',axes=['query position','key position'])
        weighted=observe('weighted_values',attention@v,['attention','retained_values'],'attention @ V')
        projected=dense(weighted,'attention_output','weighted_values')
        x=observe('attention_residual',x+projected,['embedding','attention_output'],'X + attention output')
        up=dense(norm(x,'ln2','attention_residual'),'ff_up','ln2')
        activated=observe('gelu',0.5*up*(1+torch.tanh(math.sqrt(2/math.pi)*(up+0.044715*up**3))),['ff_up'],'0.5*x*(1+tanh(sqrt(2/pi)*(x+0.044715*x^3)))')
        x=observe('ff_residual',x+dense(activated,'ff_down','gelu'),['attention_residual','ff_down'],'residual + feed-forward output')
        final=norm(x,'ln_final','ff_residual')
        logits=observe('logits',final@p['lm_head']+p['lm_bias'],['ln_final','parameter:lm_head','parameter:lm_bias'],'final hidden @ output weights + bias',layer=None,axes=['position','vocabulary ID'])
        return dict(logits=logits,keys=k,values=v,observations=observations)

    def export(self,provenance):
        result=deepcopy(self.template)
        result['parameters']={name:value.detach().cpu().tolist() for name,value in self.weights.items()}
        result['provenance']=deepcopy(provenance);Model(result)
        return result
