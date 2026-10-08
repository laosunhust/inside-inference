# Existing models with small vocabularies

Research checkpoint: 2026-10-08. Question: are existing language models limited
to tiny character alphabets or vocabularies above 1,000 IDs? **No.** There are
released models in the hundreds, including a close word-level example. Vocabulary
size, parameter count, architecture, and learned capability must be compared
separately. This search does not establish an exhaustive inventory.

## Concrete references

| Model | Vocabulary | What it establishes | Transfer limits |
| --- | --- | --- | --- |
| Karpathy nanoGPT Shakespeare example | 65 character IDs | A small alphabet can generate text beyond names. | Characters are not a closed spoken lexicon; its dataset script has no arbitrary-input fallback. |
| Karpathy `stories260K` | 512 custom SentencePiece tokens; approximately 260K parameters | A released checkpoint near our vocabulary budget, with training configuration and tokenizer artifacts. | Five layers, eight query heads, four K/V heads; story completion is not conversation or our single-head baseline. |
| MacroStories | 378 WordLevel entries; 19,969 parameters | A released, very small model with a constrained story vocabulary. | One block applied four times, two query heads sharing one K/V head, custom architecture; no conversational capability claimed. |
| Google ByT5 | 384 entries: 256 bytes, three basic special tokens, 125 sentinels | Exactly our ID count already exists in a pretrained language model family. | Byte-level encoder–decoder models, not a few hundred spoken words or a tiny decoder-only GPT. |
| SpaceByte paper's byte-level models | 256 byte vocabulary in its accounting | Hundreds of symbols also occur in language modeling research at much larger parameter scales. | Byte-level modeling does not enforce a bounded word lexicon; published system costs do not predict ours. |

Primary sources:

- [nanoGPT's actual character preparation script](https://github.com/karpathy/nanoGPT/blob/master/data/shakespeare_char/prepare.py)
  records 65 entries. This supplements the earlier microGPT-versus-GPT-2 comparison.
- [Karpathy's 260K training recipe and samples](https://huggingface.co/karpathy/tinyllamas/blob/0bd21da7698eaf29a0d7de3992de8a46ef624add/stories260K/readme.md)
  explicitly specify `vocab_size=512`. The first seven little-endian integers of
  the released legacy `stories260K.bin` were also read without executing it:
  dimension 64, FFN dimension 172, five layers, eight query heads, four K/V heads,
  vocabulary 512, context 512. Repository revision:
  `0bd21da7698eaf29a0d7de3992de8a46ef624add`. No generation was reproduced here.
- [MacroStories model card](https://huggingface.co/raincandy-u/MacroStories/blob/dc1ef998bf5331f7f70a77c815ed3e4f643a0ba7/README.md),
  [configuration](https://huggingface.co/raincandy-u/MacroStories/blob/dc1ef998bf5331f7f70a77c815ed3e4f643a0ba7/config.json),
  and [tokenizer](https://huggingface.co/raincandy-u/MacroStories/blob/dc1ef998bf5331f7f70a77c815ed3e4f643a0ba7/tokenizer.json)
  were read directly. Counting the tokenizer's vocabulary confirms 378 entries;
  it uses WordLevel matching after byte-level pretokenization and has an unknown
  token, not our reversible byte/hex fallback. Some entries represent spacing,
  punctuation, and numbered character markers rather than ordinary words.
  Its display helper replaces character markers with names. The inspected file
  listing includes weights and a final experiment configuration, but no training
  corpus or complete trainer. The model card has no explicit license field;
  inspect reuse terms before importing artifacts. Its author-reported quality
  results have not been independently reproduced here.
- [ByT5 configuration](https://huggingface.co/google/byt5-small/blob/ce8f3a48ed7676af36476a01fb01f95ea529599c/config.json),
  [tokenizer configuration](https://huggingface.co/google/byt5-small/blob/main/tokenizer_config.json),
  and [paper](https://aclanthology.org/2022.tacl-1.17/) distinguish byte symbols
  and special tokens from lexical vocabulary.
- [SpaceByte paper, appendix A](https://papers.nips.cc/paper_files/paper/2024/file/e1f418450107c4a0ddc16d008d131573-Paper-Conference.pdf)
  states the vocabulary convention for its byte-level and subword models.

## Consequences for this instrument

The earlier comparison of 27-character microGPT with large subword vocabularies
was incomplete. Karpathy's 512-token model is a directly relevant reference, and
MacroStories is especially close in vocabulary count and bounded content.
We should not justify our work by claiming that models of this size do not exist.

Keep the agreed 384-ID contract for the next checkpoint. Readable lexical entries
are useful for inspection; byte/hex fallback buys arbitrary UTF-8 representation
by spending sequence positions. Neither choice demonstrates learned understanding.
Existing weights cannot simply be relabeled into our token IDs: their embedding
rows, output projection, vocabulary semantics, and architecture belong together.

Use the references to inform vocabulary and corpus design, and later compare
preparation workflows. Retain the planned single-block, single-head baseline;
do not import recurrent depth or shared K/V simply to match a published sample.
Dataset construction should distinguish story continuation from the requested
context-dependent conversations and freeze held-out tests before training.

False-positive risk: published samples or author scores may reflect a narrow
distribution, selection, or renderer transformations. False-negative risk: a
naïve model or poorly curated corpus may fail even though another configuration
at the same vocabulary size succeeds. Neither outcome ranks vocabulary sizes.

## Next bounded checkpoint

The requested tokenizer/dataset work should produce a reviewable allocation of
all 384 IDs; explicit matching, framing, and malformed-input rules; executable
round-trip and trace checks; and an initial corpus with provenance, split rules,
coverage, duplicates, and fully framed sequence lengths reported. Review vocabulary
by conversational function before treating frequency counts as a manifest.

A corpus draft is not a validated training distribution. Keep unresolved choices
and uncovered cases visible. This checkpoint does not require a trainer, model
implementation, GPU run, browser integration, or a claim that T1/L1 are complete.
