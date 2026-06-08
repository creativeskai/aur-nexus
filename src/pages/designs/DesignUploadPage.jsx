import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input, Textarea, Select } from '../../components/ui/Input'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Upload, ImagePlus, X, ArrowLeft } from 'lucide-react'

const CATEGORIES = ['Sneakers','Slides','Sandals','T-Shirts','Oversized T-Shirts','Jerseys','Shirts','Hoodies','Sweatshirts','Jackets','Trousers','Cargo Pants','Shorts','Joggers','Denim','Caps','Beanies','Socks','Bags','Rings','Chains','Bracelets','Pendants']
const SEASONS = ['SS25','AW25','SS26','AW26','SS27','AW27','SS28']
const GENDERS = ['Men','Women','Unisex','Kids']
const MARKETS = ['India','Global','South Asia','Middle East','Southeast Asia']

function FormSection({ title, children }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #E8E4DC', background: '#FAFAF7' }}>
        <span style={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F' }}>{title}</span>
      </div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {children}
      </div>
    </div>
  )
}

function FileZone({ label, accept, files, onFiles, onRemove }) {
  const ref = useRef()
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const newFiles = [...e.dataTransfer.files]
    onFiles(prev => [...prev, ...newFiles])
  }

  const handleChange = (e) => {
    onFiles(prev => [...prev, ...[...e.target.files]])
    e.target.value = ''
  }

  return (
    <div>
      <label style={{ fontSize: '10px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9A948F', display: 'block', marginBottom: '8px' }}>
        {label}
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => ref.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#0D0D0D' : '#E8E4DC'}`,
          borderRadius: '10px', padding: '28px 20px',
          textAlign: 'center', cursor: 'pointer',
          background: dragging ? '#F5F2EC' : 'transparent',
          transition: 'all 0.15s'
        }}
      >
        <input ref={ref} type="file" accept={accept} multiple style={{ display: 'none' }} onChange={handleChange} />
        <ImagePlus size={22} color="#C8A96E" strokeWidth={1.5} style={{ margin: '0 auto 10px' }} />
        <p style={{ fontSize: '13px', color: '#0D0D0D', fontWeight: 500 }}>Drop files or <span style={{ color: '#C8A96E', textDecoration: 'underline' }}>browse</span></p>
        <p style={{ fontSize: '11px', color: '#9A948F', marginTop: '4px', fontFamily: 'DM Mono, monospace' }}>{accept}</p>
      </div>

      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {files.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#F5F2EC', border: '1px solid #E8E4DC',
              borderRadius: '6px', padding: '5px 10px'
            }}>
              <span style={{ fontSize: '12px', color: '#0D0D0D', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <button onClick={(e) => { e.stopPropagation(); onRemove(i) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A948F', display: 'flex', padding: 0 }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DesignUploadPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [collections, setCollections] = useState([])
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState('')
  const [designFiles, setDesignFiles] = useState([])
  const [inspirationFiles, setInspirationFiles] = useState([])
  const [moodboardFiles, setMoodboardFiles] = useState([])

  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    supabase.from('collections').select('id,name').eq('status', 'active')
      .then(({ data }) => setCollections(data || []))
  }, [])

  async function uploadFile(file, designId, fileType) {
    const ext = file.name.split('.').pop().toLowerCase()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${designId}/${fileType}/${Date.now()}_${safeName}`

    const { error } = await supabase.storage.from('design-files').upload(path, file, {
      cacheControl: '3600', upsert: false
    })
    if (error) { console.error('Upload error:', error); return null }

    const { data: { publicUrl } } = supabase.storage.from('design-files').getPublicUrl(path)

    await supabase.from('design_files').insert({
      design_id: designId,
      file_type: fileType,
      file_url: publicUrl,
      file_name: file.name,
      file_format: ext,
      uploaded_by: profile.id
    })
    return publicUrl
  }

  async function onSubmit(data) {
    setSaving(true)
    try {
      setProgress('Creating design…')
      const { data: design, error } = await supabase.from('designs').insert({
        name: data.name,
        collection_id: data.collection_id || null,
        category: data.category,
        description: data.description || null,
        design_story: data.design_story || null,
        launch_window: data.launch_window || null,
        season: data.season || null,
        drop_name: data.drop_name || null,
        gender: data.gender || null,
        intended_market: data.intended_market || null,
        designer_id: profile.id,
        status: 'draft',
        current_version: 1
      }).select().single()

      if (error) throw error

      await supabase.from('design_versions').insert({
        design_id: design.id, version_number: 1,
        uploaded_by: profile.id, change_note: 'Initial upload'
      })

      await supabase.from('status_history').insert({
        design_id: design.id, changed_by: profile.id,
        from_status: null, to_status: 'draft'
      })

      const allFiles = [
        ...designFiles.map(f => ({ file: f, type: 'design_image' })),
        ...inspirationFiles.map(f => ({ file: f, type: 'inspiration_image' })),
        ...moodboardFiles.map(f => ({ file: f, type: 'moodboard_image' })),
      ]

      for (let i = 0; i < allFiles.length; i++) {
        const { file, type } = allFiles[i]
        setProgress(`Uploading ${i + 1} of ${allFiles.length}: ${file.name}`)
        await uploadFile(file, design.id, type)
      }

      toast.success('Design uploaded successfully')
      navigate(`/designs/${design.id}`)
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Upload failed')
    }
    setSaving(false)
    setProgress('')
  }

  const grid2 = null
  const grid3 = null

  return (
    <div style={{ maxWidth: '800px' }}>
      <button onClick={() => navigate('/designs')} style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '13px', color: '#9A948F', background: 'none', border: 'none',
        cursor: 'pointer', marginBottom: '32px', padding: 0
      }}>
        <ArrowLeft size={14} strokeWidth={1.5} /> All Designs
      </button>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 300 }}>Upload Design</h1>
        <p style={{ fontSize: '13px', color: '#9A948F', marginTop: '6px' }}>Add a new design to the AUR product pipeline.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormSection title="Product Information">
          <Input label="Design Name *" placeholder="e.g. AUR Runner Low — Ivory"
            {...register('name', { required: 'Design name is required' })}
            error={errors.name?.message}
          />
          <div className="form-grid-2">
            <Select label="Category *" {...register('category', { required: 'Category is required' })} error={errors.category?.message}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Collection" {...register('collection_id')}>
              <option value="">No collection</option>
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <Textarea label="Description" placeholder="Brief product description" rows={2} {...register('description')} />
          <Textarea label="Design Story" placeholder="The inspiration, narrative, or concept behind this design" rows={3} {...register('design_story')} />
        </FormSection>

        <FormSection title="Launch & Market">
          <div className="form-grid-3">
            <Select label="Season" {...register('season')}>
              <option value="">Select</option>
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Launch Window" placeholder="e.g. March 2027" {...register('launch_window')} />
            <Input label="Drop Name" placeholder="e.g. Drop 01" {...register('drop_name')} />
          </div>
          <div className="form-grid-2">
            <Select label="Gender" {...register('gender')}>
              <option value="">Select</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
            <Select label="Intended Market" {...register('intended_market')}>
              <option value="">Select</option>
              {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
        </FormSection>

        <FormSection title="Media">
          <FileZone label="Design Images" accept=".jpg,.jpeg,.png,.webp,.pdf,.ai,.psd,.svg"
            files={designFiles} onFiles={setDesignFiles}
            onRemove={i => setDesignFiles(f => f.filter((_, idx) => idx !== i))}
          />
          <FileZone label="Inspiration Images" accept=".jpg,.jpeg,.png,.webp"
            files={inspirationFiles} onFiles={setInspirationFiles}
            onRemove={i => setInspirationFiles(f => f.filter((_, idx) => idx !== i))}
          />
          <FileZone label="Moodboard" accept=".jpg,.jpeg,.png,.webp,.pdf"
            files={moodboardFiles} onFiles={setMoodboardFiles}
            onRemove={i => setMoodboardFiles(f => f.filter((_, idx) => idx !== i))}
          />
        </FormSection>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button type="submit" disabled={saving}>
            <Upload size={14} strokeWidth={1.5} />
            {saving ? (progress || 'Saving…') : 'Save Design'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/designs')}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
