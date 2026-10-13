/* One verified HTTP asset reader for same-origin files and CORS object storage. */
export async function readAsset(storage, asset, origin) {
  const base=new URL(storage.base_url,origin), url=new URL(asset.path,base);
  if(!['https:','http:'].includes(url.protocol) || url.origin!==base.origin || !url.pathname.startsWith(base.pathname))throw Error('Invalid model asset location');
  const response=await fetch(url,{credentials:'omit'});
  if(!response.ok)throw Error(`Model asset unavailable (${response.status}): ${asset.path}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.byteLength!==asset.bytes)throw Error(`Model asset size mismatch: ${asset.path}`);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(digest!==asset.sha256)throw Error(`Model asset digest mismatch: ${asset.path}`);
  return bytes;
}

export async function readCatalog(origin) {
  const response=await fetch(new URL('models/catalog.json',origin),{credentials:'omit'});
  if(!response.ok)throw Error(`Model catalog unavailable (${response.status})`);
  return response.json();
}
