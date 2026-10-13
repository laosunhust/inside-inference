#define main upstream_main
#include "run.c"
#undef main
static Transformer model;
static Tokenizer tokenizer;
static int loaded=0;
int load_model(void) {
  if(loaded){free_transformer(&model);free_tokenizer(&tokenizer);}
  build_transformer(&model,"/weights.bin");
  build_tokenizer(&tokenizer,"/tokenizer.bin",model.config.vocab_size);
  loaded=1;
  return model.config.vocab_size;
}
int tokenize(char* text,int* ids) {int n=0;encode(&tokenizer,text,1,0,ids,&n);return n;}
float* step(int token,int pos) {return forward(&model,token,pos);}
char* piece(int previous,int token) {return decode(&tokenizer,previous,token);}
char* vocab_piece(int token) {return tokenizer.vocab[token];}
