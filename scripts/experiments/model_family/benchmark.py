"""Disposable throughput admission; no accuracy inspection or checkpoint selection."""
import json,random,time
from pathlib import Path
import torch
from inside_inference.model import initialize,ModelArchitecture,parameter_shapes
from inside_inference.preparation import PreparationModel,prepare_examples,make_optimizer,train_step,response_loss
from inside_inference.tokenizer import Tokenizer


def main():
    torch.set_num_threads(1); torch.use_deterministic_algorithms(True)
    config=json.loads(Path('data/preparation/multiword.json').read_text())
    codec=Tokenizer();examples=prepare_examples('shortest-multiword-v1',11)
    reports=[]
    for layers,width in [(1,8),(1,16),(2,8)]:
        architecture=ModelArchitecture(layers=layers,width=width,ffn=width*2)
        model=PreparationModel(initialize(architecture,codec.manifest_sha256,7))
        optimizer=make_optimizer(model,config);sampler=random.Random(7)
        start=time.monotonic()
        for _ in range(100):
            batch=[examples['train'][sampler.randrange(len(examples['train']))] for _ in range(16)]
            train_step(model,optimizer,batch,codec.token_id('control','PAD'))
        training=time.monotonic()-start
        # Measure teacher-forced development loss cost only; do not inspect accuracy.
        start=time.monotonic()
        with torch.no_grad(): response_loss(model,examples['development'],codec.token_id('control','PAD'))
        development=time.monotonic()-start
        reports.append(dict(layers=layers,width=width,updates=100,training_seconds=training,
            development_loss_seconds=development,estimated_4000_updates_seconds=40*training))
    out=Path('out/experiments/model-family/throughput.json');out.write_text(json.dumps(reports,indent=2)+'\n')
    print(out.read_text())

if __name__=='__main__':main()
