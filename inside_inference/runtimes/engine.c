/* One decoder engine, specialized only by declared scalar precision.
 * Attention/RoPE/RMSNorm/SiLU arithmetic follows pinned llama2.c (MIT).
 * Learned positions, LayerNorm and GELU preserve the inspectable checkpoint.
 */
#include <math.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <ctype.h>
#include "tokenizer.c"
static int D,F,L,H,V,N,wide,absolute,layernorm,gelu,capture;
static double epsilon,matmul_work;
double step_flops(void){return matmul_work;}
static void *weights[24], *scratch, *keys, *values;
static Tokenizer tokenizer;
static int tokenizer_loaded;
enum {EMBED,POSITION,N1,N1B,Q,QB,K,KB,VAL,VB,O,OB,N2,N2B,UP,UPB,DOWN,DOWNB,GATE,FINAL,FINALB,HEAD,HEADB};
typedef struct {const char *name;int layer,length;double *data;} Trace;
static Trace traces[256];static int traces_count;
static void clear_traces(void){for(int i=0;i<traces_count;i++)free(traces[i].data);traces_count=0;}
int trace_count(void){return traces_count;}
const char *trace_name(int i){return traces[i].name;}
int trace_layer(int i){return traces[i].layer;}
int trace_length(int i){return traces[i].length;}
double *trace_data(int i){return traces[i].data;}
void configure(int d,int f,int l,int h,int v,int n,int is_double,int features,double eps,int inspect){
 clear_traces();free(scratch);free(keys);free(values);
 for(int i=0;i<24;i++)if(i!=HEAD||weights[i]!=weights[EMBED])free(weights[i]);
 memset(weights,0,sizeof(weights));
 D=d;F=f;L=l;H=h;V=v;N=n;wide=is_double;absolute=features&1;layernorm=features&2;gelu=features&4;epsilon=eps;capture=inspect;
 int size=wide?sizeof(double):sizeof(float);
 scratch=calloc(5*D+2*F+H*N+V,size);keys=calloc(L*N*D,size);values=calloc(L*N*D,size);
}
void tie_head(void){weights[HEAD]=weights[EMBED];}
void *allocate_weight(int slot,int count){weights[slot]=calloc(count,wide?sizeof(double):sizeof(float));return weights[slot];}
#define T float
#define FN(x) f_##x
#define SQRT sqrtf
#define EXP expf
#define POW powf
#define COS cosf
#define SIN sinf
#define TANH tanhf
#include "decoder.h"
#undef T
#undef FN
#undef SQRT
#undef EXP
#undef POW
#undef COS
#undef SIN
#undef TANH
#define T double
#define FN(x) d_##x
#define SQRT sqrt
#define EXP exp
#define POW pow
#define COS cos
#define SIN sin
#define TANH tanh
#include "decoder.h"
void *step(int token,int pos){clear_traces();matmul_work=0;return wide?(void*)d_forward(token,pos):(void*)f_forward(token,pos);}
void load_tokenizer(int vocabulary){if(tokenizer_loaded)free_tokenizer(&tokenizer);build_tokenizer(&tokenizer,"/tokenizer.bin",vocabulary);tokenizer_loaded=1;}
int tokenize(char *text,int *ids){int n=0;encode(&tokenizer,text,1,0,ids,&n);return n;}
char *piece(int previous,int token){return decode(&tokenizer,previous,token);}
char *vocab_piece(int token){return tokenizer.vocab[token];}
void *key_rows(int layer){return (char*)keys+layer*N*D*(wide?8:4);}
void *value_rows(int layer){return (char*)values+layer*N*D*(wide?8:4);}
