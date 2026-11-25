import {useEffect, useMemo, useState, type FormEvent} from 'react';

type Product={id:number;name:string;category:string;variant:string;description:string;price:number;imageUrl:string;active:boolean};
type Draft={name:string;category:string;variant:string;description:string;price:string};
const API=((import.meta as ImportMeta & {env?:{VITE_API_BASE_URL?:string}}).env?.VITE_API_BASE_URL||'http://localhost:8080').replace(/\/$/,'');
const empty:Draft={name:'',category:'Mie Ayam',variant:'',description:'',price:''};
const money=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
const categories=['Mie Ayam','Mie Jebew','Pangsit','Minuman','Add On'];

export default function App(){
 const [products,setProducts]=useState<Product[]>([]);
 const [token,setToken]=useState(()=>localStorage.getItem('pakde_admin_token')||'');
 const [username,setUsername]=useState('iwan');
 const [password,setPassword]=useState('');
 const [loginError,setLoginError]=useState('');
 const [loggingIn,setLoggingIn]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('Semua');
 const [draft,setDraft]=useState<Draft>(empty);
 const [editing,setEditing]=useState<number|null>(null);
 const [saving,setSaving]=useState(false);
 const [uploading,setUploading]=useState<number|null>(null);
 const [showInactive,setShowInactive]=useState(false);
 async function load(){
  setLoading(true);setError('');
  try{const r=await fetch(API+'/api/products?all=true');if(!r.ok)throw new Error('Gagal mengambil katalog. Pastikan backend dan PostgreSQL aktif.');setProducts(await r.json());}
  catch(e){setError(e instanceof Error?e.message:'Tidak dapat terhubung ke backend');}
  finally{setLoading(false);}
 }
 useEffect(()=>{if(token) void load();else setLoading(false);},[token]);
 async function login(e:FormEvent){e.preventDefault();setLoggingIn(true);setLoginError('');try{const r=await fetch(API+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});const body=await r.json();if(!r.ok)throw new Error(body.error||'Login gagal');localStorage.setItem('pakde_admin_token',body.token);setToken(body.token);setPassword('');}catch(e){setLoginError(e instanceof Error?e.message:'Login gagal');}finally{setLoggingIn(false);}}
 function logout(){localStorage.removeItem('pakde_admin_token');setToken('');setProducts([]);reset();}
 const filtered=useMemo(()=>products.filter(p=>(showInactive||p.active)&&(category==='Semua'||p.category===category)&&[p.name,p.variant,p.category].join(' ').toLowerCase().includes(query.toLowerCase())),[products,category,query,showInactive]);
 function startEdit(p:Product){setEditing(p.id);setDraft({name:p.name,category:p.category,variant:p.variant||'',description:p.description||'',price:String(p.price)});window.scrollTo({top:0,behavior:'smooth'});}
 function reset(){setEditing(null);setDraft(empty);}
 async function submit(e:FormEvent){
  e.preventDefault();setSaving(true);setError('');
  const payload={...draft,price:Number(draft.price),active:true};
  try{const r=await fetch(API+(editing?'/api/products/'+editing:'/api/products'),{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(payload)});if(!r.ok){const body=await r.json().catch(()=>({}));throw new Error(body.error||'Gagal menyimpan produk');}reset();await load();}
  catch(e){setError(e instanceof Error?e.message:'Gagal menyimpan produk');}
  finally{setSaving(false);}
 }
 async function upload(id:number,file?:File){
  if(!file)return;if(!['image/jpeg','image/png'].includes(file.type)){setError('Foto harus JPG atau PNG.');return;}if(file.size>5*1024*1024){setError('Ukuran foto maksimal 5 MB.');return;}
  const data=new FormData();data.append('image',file);setUploading(id);setError('');
  try{const r=await fetch(API+'/api/products/'+id+'/image',{method:'POST',headers:{'Authorization':'Bearer '+token},body:data});if(!r.ok){const body=await r.json().catch(()=>({}));throw new Error(body.error||'Upload foto gagal');}await load();}
  catch(e){setError(e instanceof Error?e.message:'Upload foto gagal');}
  finally{setUploading(null);}
 }
 async function deactivate(p:Product){
  if(!window.confirm('Nonaktifkan '+p.name+' '+p.variant+'?'))return;
  try{const r=await fetch(API+'/api/products/'+p.id,{method:'DELETE',headers:{'Authorization':'Bearer '+token}});if(!r.ok)throw new Error('Gagal menonaktifkan produk');await load();}
  catch(e){setError(e instanceof Error?e.message:'Gagal menonaktifkan produk');}
 }
 const activeCount=products.filter(p=>p.active).length;
 if(!token) return <main className="login-shell"><form className="login-card" onSubmit={login}><span className="eyebrow">PAK DE SURYA · ADMIN</span><h1>Selamat Datang</h1><p>Masuk untuk mengelola katalog produk</p>{loginError&&<div className="alert">{loginError}</div>}<label>Username<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required/></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="primary" disabled={loggingIn}>{loggingIn?'Memeriksa...':'Login Admin'}</button></form></main>;
 return <main className="app-shell">
  <header className="topbar"><div><span className="eyebrow">MIE AYAM · LEZAT · HALAL · BERKAH</span><h1>Pak De Surya</h1><p>Manajemen Produk</p></div><div className="header-actions"><button className="refresh" onClick={()=>void load()}>↻ Refresh</button><button className="refresh" onClick={logout}>Keluar</button></div></header>
  <section className="summary"><div><span>Produk aktif</span><strong>{activeCount}</strong></div><div><span>Total varian</span><strong>{products.length}</strong></div><div><span>Foto produk</span><strong>{products.filter(p=>p.imageUrl).length}</strong></div></section>
  {error&&<div className="alert">{error}<button onClick={()=>setError('')}>Tutup</button></div>}
  <section className="panel form-panel"><div className="panel-heading"><div><span className="eyebrow">{editing?'UBAH DATA':'KATALOG MENU'}</span><h2>{editing?'Edit Produk':'Tambah Produk'}</h2></div>{editing&&<button className="text-button" onClick={reset}>Batal edit</button>}</div>
   <form onSubmit={submit} className="product-form">
    <label>Nama produk<input required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Contoh: Mie Ayam Original"/></label>
    <label>Kategori<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
    <label>Varian / ukuran<input value={draft.variant} onChange={e=>setDraft({...draft,variant:e.target.value})} placeholder="Normal, Jumbo, Level 0–2..."/></label>
    <label>Harga (Rp)<input required type="number" min="0" step="500" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} placeholder="17000"/></label>
    <label className="wide">Deskripsi (opsional)<input value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="Keterangan produk"/></label>
    <div className="form-actions"><button className="primary" disabled={saving}>{saving?'Menyimpan...':editing?'Simpan Perubahan':'＋ Tambah Produk'}</button></div>
   </form>
  </section>
  <section className="panel"><div className="panel-heading"><div><span className="eyebrow">DAFTAR MENU</span><h2>Produk & Harga</h2></div><label className="inactive-toggle"><input type="checkbox" checked={showInactive} onChange={e=>setShowInactive(e.target.checked)}/> Tampilkan nonaktif</label></div>
   <div className="filters"><input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari nama produk..."/><select value={category} onChange={e=>setCategory(e.target.value)}><option>Semua</option>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
   {loading?<p className="state">Memuat katalog...</p>:filtered.length===0?<p className="state">Tidak ada produk yang cocok.</p>:<div className="product-grid">{filtered.map(p=><article className={'product-card '+(!p.active?'inactive':'')} key={p.id}>
    <div className="photo">{p.imageUrl?<img src={API+p.imageUrl} alt={p.name}/>:<span>🍜</span>}<label className="upload-label">{uploading===p.id?'Mengunggah...':'＋ Foto'}<input type="file" accept="image/jpeg,image/png" disabled={uploading===p.id} onChange={e=>{void upload(p.id,e.target.files?.[0]);e.currentTarget.value='';}}/></label></div>
    <div className="product-body"><div className="product-top"><span className="category-tag">{p.category}</span><span className={p.active?'status':'status off'}>{p.active?'Aktif':'Nonaktif'}</span></div><h3>{p.name}</h3>{p.variant&&<p className="variant">{p.variant}</p>}<strong className="price">{money(p.price)}</strong>
     <div className="card-actions"><button onClick={()=>startEdit(p)}>Edit</button>{p.active&&<button className="danger" onClick={()=>void deactivate(p)}>Nonaktifkan</button>}</div>
    </div></article>)}</div>}
  </section>
  <footer>Harga pada katalog ini berlaku untuk Dine In dan Take Away. Foto produk dapat ditambahkan atau diganti kapan saja.</footer>
 </main>;
}
