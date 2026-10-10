"""Numerical/cache-policy and resource-conservation checks for the KV lab."""
from copy import deepcopy
import unittest

from inside_inference.cache_lab import default_experiment, run_cache_experiment, replay_cache
from inside_inference.tokenizer import Tokenizer, Turn


def scenario(texts=('the ball','the ball'), *, device=16384, host=32768, active=1):
    spec=default_experiment();template=spec['workload']['requests'][0]
    spec['system'].update(device_kv_bytes=device,host_kv_bytes=host,max_active_requests=active)
    spec['workload']['requests']=[]
    for i,text in enumerate(texts):
        item=deepcopy(template);item.update(request_id=f'r{i}',arrival_us=0)
        item['request']['text']=text;item['request']['generation']['max_new_tokens']=2
        spec['workload']['requests'].append(item)
    return spec


class CacheLabTests(unittest.TestCase):
    def test_hand_calculated_service_and_causal_links(self):
        run=run_cache_experiment(scenario())
        # Width 8, FFN 16, 384 output IDs: 8,168 binary64 parameters.
        # Six prefix positions, final prompt position, then one decode position.
        # Memory-limited service: 66.880 + 66.368 + 66.496 us;
        # retention reads/writes 768 bytes each: 1.536 us.
        # The second request reuses the prefix and executes only 66.368+66.496 us.
        self.assertAlmostEqual(run['events'][-1]['time_us'],334.144,places=9)
        seen=set()
        for event in run['events']:
            self.assertTrue(set(event['causes'])<=seen)
            if event['kind']!='arrived':self.assertTrue(event['causes'])
            seen.add(event['event_id'])
        node_ids=[]
        for work in run['computations']:
            for node in work['nodes']:
                self.assertEqual(node['run_id'],run['id'])
                self.assertTrue(node['id'].startswith(work['work_id']+'/'))
                node_ids.append(node['id'])
        self.assertEqual(len(node_ids),len(set(node_ids)))

    def test_exact_hit_avoids_prefix_compute_and_preserves_logits(self):
        r=run_cache_experiment(scenario())
        lookups=[e['kind'] for e in r['events'] if e['kind'] in ('local-hit','remote-hit','miss')]
        self.assertEqual(lookups,['miss','local-hit'])
        first=[c for c in r['computations'] if c['request_id']=='r0' and c['selection']]
        second=[c for c in r['computations'] if c['request_id']=='r1' and c['selection']]
        self.assertEqual([c['selection'] for c in first],[c['selection'] for c in second])
        self.assertEqual(sum(c['phase']=='cache-build' for c in r['computations']),1)
        self.assertTrue(all(c['reference_max_abs_error']<=1e-10 for c in r['computations']))
        replay_cache(r)
        bad=deepcopy(r);bad['events'][0]['detail']='tampered'
        with self.assertRaisesRegex(ValueError,'replay differs'):replay_cache(bad)

    def test_capacity_causes_remote_hit_and_host_eviction_causes_miss(self):
        n=len(Tokenizer().encode_prompt([Turn(role='user', text='the ball')],context_limit=128).ids)
        capacity=(n+1)*8*16
        for host,expected in ((32768,['miss','miss','remote-hit']),(0,['miss','miss','miss'])):
            r=run_cache_experiment(scenario(('the ball','the cup','the ball'),device=capacity,host=host))
            self.assertEqual([e['kind'] for e in r['events'] if e['kind'] in ('local-hit','remote-hit','miss')],expected)
            self.assertTrue(all(e['device_reserved_bytes']<=capacity and e['host_retained_bytes']<=host for e in r['events']))
            if host:
                transfers=[e for e in r['events'] if e['kind']=='transfer-start']
                self.assertTrue(any(e['detail']=='host-to-device' for e in transfers))
                for start in transfers:
                    finish=next(e for e in r['events'][r['events'].index(start)+1:] if e['kind']=='transfer-end')
                    expected_us=r['declaration']['system']['link_latency_us']+start['bytes']/r['declaration']['system']['link_bytes_per_us']
                    self.assertAlmostEqual(finish['time_us']-start['time_us'],expected_us)

    def test_admission_backpressure_and_shared_compute(self):
        n=len(Tokenizer().encode_prompt([Turn(role='user', text='the ball')],context_limit=128).ids)
        capacity=(n+1)*8*16
        r=run_cache_experiment(scenario(device=capacity,active=2))
        finished=next(e for e in r['events'] if e['kind']=='finished' and e['request_id']=='r0')
        admitted=next(e for e in r['events'] if e['kind']=='admitted' and e['request_id']=='r1')
        self.assertGreaterEqual(admitted['time_us'],finished['time_us'])
        overlap=run_cache_experiment(scenario(active=2))
        admissions=[e for e in overlap['events'] if e['kind']=='admitted']
        self.assertEqual([e['time_us'] for e in admissions],[0,0])
        work=[e for e in overlap['events'] if e['kind']=='compute-start']
        self.assertEqual([e['request_id'] for e in work[:4]],['r0','r1','r0','r1'])

    def test_invalid_capacity_and_workload_fail_before_execution(self):
        cases=[]
        small=scenario(device=1);cases.append(small)
        duplicate=scenario();duplicate['workload']['requests'][1]['request_id']='r0';cases.append(duplicate)
        reversed_time=scenario();reversed_time['workload']['requests'][0]['arrival_us']=2;cases.append(reversed_time)
        for spec in cases:
            with self.assertRaises(ValueError):run_cache_experiment(spec)

    def test_resource_intervention_changes_time_not_tokens(self):
        spec=scenario();baseline=run_cache_experiment(spec)
        spec['system']['compute_flops_per_us']/=10
        slower=run_cache_experiment(spec)
        tokens=lambda r:[c['selection']['selected_id'] for c in r['computations'] if c['selection']]
        self.assertEqual(tokens(baseline),tokens(slower))
        self.assertGreater(slower['events'][-1]['time_us'],baseline['events'][-1]['time_us'])
