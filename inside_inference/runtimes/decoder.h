/* Included for float and double: the algorithm and control flow have one source. */
static void FN(record)(const char *name,int layer,T *data,int length){
 if(!capture)return;
 Trace *t=&traces[traces_count++];t->name=name;t->layer=layer;t->length=length;t->data=malloc(length*sizeof(double));
 for(int i=0;i<length;i++)t->data[i]=data[i];
}
static void FN(linear)(T *out,T *x,int slot,int bias,int layer,int in,int count){
 matmul_work+=2.0*in*count;
 T *w=(T*)weights[slot]+layer*in*count,*b=weights[bias]?(T*)weights[bias]+layer*count:NULL;
 for(int i=0;i<count;i++){T sum=0;for(int j=0;j<in;j++)sum+=x[j]*w[i*in+j];out[i]=sum+(b?b[i]:0);}
}
static void FN(norm)(T *out,T *x,int slot,int bias,int layer,const char *name){
 T mean=0,variance=0,*w=(T*)weights[slot]+(layer<0?0:layer*D),*b=weights[bias]?(T*)weights[bias]+(layer<0?0:layer*D):NULL;
 if(layernorm){for(int i=0;i<D;i++)mean+=x[i];mean/=D;}
 for(int i=0;i<D;i++){T a=x[i]-mean;variance+=a*a;}variance/=D;
 if(layernorm){T scale=SQRT(variance+(T)epsilon);for(int i=0;i<D;i++)out[i]=(x[i]-mean)/scale*w[i]+b[i];}
 else {T scale=(T)1/SQRT(variance+(T)epsilon);for(int i=0;i<D;i++)out[i]=w[i]*(scale*x[i]);}
 if(capture&&layernorm){
  const char *mn=slot==N1?"ln1_mean":slot==N2?"ln2_mean":"ln_final_mean";
  const char *vn=slot==N1?"ln1_variance":slot==N2?"ln2_variance":"ln_final_variance";
  FN(record)(mn,layer,&mean,1);FN(record)(vn,layer,&variance,1);
 }
 FN(record)(name,layer,out,D);
}
static T *FN(forward)(int token,int pos){
 T *x=scratch,*xb=x+D,*xb2=xb+D,*q=xb2+D,*weighted=q+D,*up=weighted+D,*gate=up+F,*att=gate+F,*logits=att+H*N;
 T *embedding=(T*)weights[EMBED]+token*D;
 memcpy(x,embedding,D*sizeof(T));FN(record)("token_embedding",-1,x,D);
 if(absolute){T *p=(T*)weights[POSITION]+pos*D;FN(record)("position_embedding",-1,p,D);for(int i=0;i<D;i++)x[i]+=p[i];FN(record)("embedding",-1,x,D);}
 for(int layer=0;layer<L;layer++){
  FN(norm)(xb,x,N1,N1B,layer,"ln1");
  int offset=layer*N*D;T *k=(T*)keys+offset+pos*D,*v=(T*)values+offset+pos*D;
  FN(linear)(q,xb,Q,QB,layer,D,D);FN(record)("query",layer,q,D);
  FN(linear)(k,xb,K,KB,layer,D,D);FN(record)("key",layer,k,D);
  FN(linear)(v,xb,VAL,VB,layer,D,D);FN(record)("value",layer,v,D);
  int head=D/H;
  if(!absolute){for(int i=0;i<D;i+=2){T freq=(T)1/POW((T)10000,(T)(i%head)/(T)head),angle=pos*freq,c=COS(angle),s=SIN(angle);
    for(int j=0;j<2;j++){T *a=j?k:q,u=a[i],v0=a[i+1];a[i]=u*c-v0*s;a[i+1]=u*s+v0*c;}}}
  for(int h=0;h<H;h++){
   matmul_work+=4.0*(pos+1)*head;
   T *a=att+h*N,*query=q+h*head,*out=weighted+h*head;
   for(int t=0;t<=pos;t++){T score=0,*key=(T*)keys+offset+t*D+h*head;for(int i=0;i<head;i++)score+=query[i]*key[i];a[t]=score/SQRT((T)head);}
   if(H==1)FN(record)("scores",layer,a,pos+1);
   T peak=a[0];for(int t=1;t<=pos;t++)if(a[t]>peak)peak=a[t];T sum=0;
   for(int t=0;t<=pos;t++){a[t]=EXP(a[t]-peak);sum+=a[t];}for(int t=0;t<=pos;t++)a[t]/=sum;
   if(H==1)FN(record)("attention",layer,a,pos+1);
   memset(out,0,head*sizeof(T));for(int t=0;t<=pos;t++){T *v0=(T*)values+offset+t*D+h*head;for(int i=0;i<head;i++)out[i]+=a[t]*v0[i];}
  }
  FN(record)("weighted_values",layer,weighted,D);
  FN(linear)(xb2,weighted,O,OB,layer,D,D);FN(record)("attention_output",layer,xb2,D);
  for(int i=0;i<D;i++)x[i]+=xb2[i];FN(record)("attention_residual",layer,x,D);
  FN(norm)(xb,x,N2,N2B,layer,"ln2");
  FN(linear)(up,xb,UP,UPB,layer,D,F);FN(record)("ff_up",layer,up,F);
  if(gelu){for(int i=0;i<F;i++){T a=up[i];up[i]=(T).5*a*((T)1+TANH(SQRT((T)2/(T)3.14159265358979323846)*(a+(T).044715*POW(a,(T)3))));}FN(record)("gelu",layer,up,F);}
  else {FN(linear)(gate,xb,GATE,UPB,layer,D,F);for(int i=0;i<F;i++){T a=up[i];a*=((T)1/((T)1+EXP(-a)));up[i]=a*gate[i];}}
  FN(linear)(xb,up,DOWN,DOWNB,layer,F,D);FN(record)("ff_down",layer,xb,D);
  for(int i=0;i<D;i++)x[i]+=xb[i];FN(record)("ff_residual",layer,x,D);
 }
 FN(norm)(xb,x,FINAL,FINALB,-1,"ln_final");FN(linear)(logits,xb,HEAD,HEADB,0,D,V);FN(record)("logits",-1,logits,V);return logits;
}
