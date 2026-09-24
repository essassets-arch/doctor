'use client';

import { useEffect, useRef, type ReactNode, type PointerEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { markerTypes, selectors, type MarkerType, type LesionImage } from '@/store/lesion-photography';
import { useLesionPhotographyStore as usePhotography, usePhotographySession } from './PhotographyProvider';
import styles from './photography.module.css';

const colors: Record<MarkerType, string> = { ERYTHEMA_MARGIN: '#dc2626', ACTIVE_INDURATION: '#7c3aed', FOLLICULAR_PAPULE: '#0369a1', PIGMENTATION_BORDER: '#92400e', SCAR_ATROPHY: '#047857' };
const dragMime = 'application/x-lesion-image';

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={styles.modal} onCancel={e => { e.preventDefault(); close(); }} aria-label={title}>
    <div className={styles.row}><h3>{title}</h3><button type="button" onClick={close} aria-label={`Close ${title}`}>Close</button></div>{children}
  </dialog>;
}

export default function PhotographyWorkspace() {
  const count = usePhotography(selectors.markerCount);
  const { errors, loadStatus, saveStatus, clearConfirmation, previewImageId, webcamStatus } = usePhotography(useShallow(s => ({ errors: s.errors, loadStatus: s.loadStatus, saveStatus: s.saveStatus, clearConfirmation: s.clearConfirmation, previewImageId: s.previewImageId, webcamStatus: s.webcamStatus })));
  const { store, controller } = usePhotographySession();
  const preview = usePhotography(s => s.images.find(i => i.id === s.previewImageId));
  const single = useRef<HTMLInputElement>(null); const multiple = useRef<HTMLInputElement>(null);
  const dragTarget = usePhotography(s => s.dragTarget);
  const upload = (files: FileList | null) => { if (files) void controller.addFiles(Array.from(files)); };
  return <section className={styles.workspace} aria-label="Lesion photography workspace">
    <header className={styles.row}><div><h2>Medical Lesion Photography &amp; Marker Annotation</h2><span className={styles.badge}>{count} Markers Placed</span></div>
      <div role="status" aria-live="polite">{loadStatus === 'loading' ? 'Loading photography…' : saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? <button type="button" onClick={() => void controller.save()}>Save failed — Retry</button> : 'Changes pending'}</div>
    </header>
    {loadStatus === 'error' && <div className={styles.error} role="alert">Photography could not be loaded. Local work is temporary and cannot be saved until the service is connected. Keep this page open.<button type="button" onClick={() => void controller.load()}>Retry loading</button></div>}
    {errors.length > 0 && <div className={styles.error} role="alert"><ul>{errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul><button type="button" onClick={() => store.getState().setUI({ errors: [] })}>Dismiss messages</button></div>}
    <fieldset disabled={loadStatus === 'loading'} className={styles.controls}>
      <AnnotationToolbar />
      <div className={styles.row}>
        <button type="button" onClick={() => store.getState().setUI({ webcamStatus: 'initializing' })}>Live Webcam</button>
        <button type="button" onClick={() => single.current?.click()}>+ Upload Photo</button>
        <button type="button" onClick={() => multiple.current?.click()}>+ Upload Multiple Images</button>
        <input ref={single} data-testid="single-photo-input" type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => { upload(e.target.files); e.target.value = ''; }} />
        <input ref={multiple} data-testid="multiple-photo-input" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e => { upload(e.target.files); e.target.value = ''; }} />
      </div>
      <button type="button" className={`${styles.drop} ${dragTarget === 'upload' ? styles.dragActive : ''}`}
        onClick={() => multiple.current?.click()}
        onDragEnter={e => { e.preventDefault(); store.getState().setUI({ dragTarget: 'upload' }); }}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) store.getState().setUI({ dragTarget: null }); }}
        onDrop={e => { e.preventDefault(); store.getState().setUI({ dragTarget: null }); upload(e.dataTransfer.files); }}>
        <strong>Multiple Image Upload</strong><span>{dragTarget === 'upload' ? 'Release files to add photos' : 'Drag & drop multiple photos here or click to batch upload'}</span><span>Select Multiple Files · JPG, PNG, WEBP · 10 MB each</span>
      </button>
      <AnnotationCanvas />
      <button type="button" disabled={!count} onClick={() => store.getState().setUI({ clearConfirmation: true })}>Clear All Markers ({count})</button>
      <Comparison />
      <Library uploadMore={() => multiple.current?.click()} />
    </fieldset>
    {clearConfirmation && <Modal title="Clear all markers?" close={() => store.getState().setUI({ clearConfirmation: false })}><p>Remove all {count} markers in this consultation? Uploaded images will remain.</p><div className={styles.row}><button type="button" onClick={() => store.getState().setUI({ clearConfirmation: false })}>Cancel</button><button type="button" onClick={() => store.getState().clearAllMarkers()}>Confirm clear markers</button></div></Modal>}
    {previewImageId && preview && <Modal title={`Preview: ${preview.name}`} close={() => store.getState().setUI({ previewImageId: null })}><ImageWithMarkers image={preview} /></Modal>}
    {webcamStatus !== 'closed' && <Webcam />}
  </section>;
}

function AnnotationToolbar() {
  const { selectedMarkerType, annotationMode, zoom } = usePhotography(useShallow(s => ({ selectedMarkerType: s.selectedMarkerType, annotationMode: s.annotationMode, zoom: s.zoom })));
  const { store } = usePhotographySession();
  return <div className={styles.row} role="toolbar" aria-label="Annotation tools">
    <label>Marker <select aria-label="Marker type" value={selectedMarkerType} onChange={e => store.getState().setSelectedMarkerType(e.target.value as MarkerType)}>{Object.entries(markerTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <button type="button" aria-pressed={annotationMode} onClick={() => store.getState().setUI({ annotationMode: !annotationMode })}>{annotationMode ? 'Marker tool active' : 'Add Marker'}</button>
    <button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => store.getState().setUI({ zoom: Math.max(1, zoom - .25) })}>−</button>
    <span>{Math.round(zoom * 100)}%</span>
    <button type="button" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => store.getState().setUI({ zoom: Math.min(3, zoom + .25) })}>+</button>
    <button type="button" onClick={() => store.getState().setUI({ zoom: 1 })}>Reset zoom</button>
  </div>;
}

function AnnotationCanvas() {
  const image = usePhotography(selectors.selectedImage);
  const markers = usePhotography(useShallow(selectors.selectedImageMarkers));
  const selectedMarkerId = usePhotography(s => s.selectedMarkerId);
  const annotationMode = usePhotography(s => s.annotationMode);
  const zoom = usePhotography(s => s.zoom);
  const { store } = usePhotographySession();
  const plane = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);
  const point = (e: PointerEvent) => { const rect = plane.current!.getBoundingClientRect(); return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }; };
  const marker = markers.find(m => m.id === selectedMarkerId);
  if (!image) return <div className={styles.empty}>Upload or capture a photo, then select it to begin annotation.</div>;
  return <div className={styles.panel}>
    <div className={styles.row}><h3>Annotate: {image.name}</h3><span>{markers.length} markers annotated</span></div>
    <p>{annotationMode ? 'Click or tap the image to place a marker. Drag a marker to move it.' : 'Activate Add Marker to place annotations. Select an existing marker to edit it.'} Arrow keys move a focused marker.</p>
    <div className={styles.viewport}>
      <div ref={plane} data-testid="annotation-image" className={styles.imagePlane} style={{ width: `${zoom * 100}%`, cursor: annotationMode ? 'crosshair' : 'default' }}
        onPointerDown={e => { if (!e.isPrimary || e.button !== 0 || (e.target as HTMLElement).closest('button')) return; const p = point(e); store.getState().addMarker(p.x, p.y); }}>
        {/* A natural-height image and its overlay share the same box: no object-fit letterboxing. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.name} draggable={false} onError={() => store.getState().reportError(`Unable to display ${image.name}. Try reloading the image service.`)} />
        {markers.map((m, index) => <button type="button" key={m.id} className={`${styles.marker} ${selectedMarkerId === m.id ? styles.selected : ''}`}
          style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, background: colors[m.type] }} title={markerTypes[m.type]}
          aria-label={`Marker ${index + 1}: ${markerTypes[m.type]}`} aria-pressed={selectedMarkerId === m.id}
          onClick={e => { e.stopPropagation(); store.getState().selectMarker(m.id); }}
          onPointerDown={e => { if (!e.isPrimary || e.button !== 0) return; e.stopPropagation(); dragging.current = m.id; e.currentTarget.setPointerCapture(e.pointerId); store.getState().selectMarker(m.id); }}
          onPointerMove={e => { if (dragging.current !== m.id) return; e.stopPropagation(); const p = point(e); store.getState().moveMarker(m.id, p.x, p.y); }}
          onPointerUp={e => { dragging.current = null; e.currentTarget.releasePointerCapture(e.pointerId); }}
          onPointerCancel={() => { dragging.current = null; }} onLostPointerCapture={() => { dragging.current = null; }}
          onKeyDown={e => { const deltas: Record<string, [number, number]> = { ArrowLeft: [-.005, 0], ArrowRight: [.005, 0], ArrowUp: [0, -.005], ArrowDown: [0, .005] }; const d = deltas[e.key]; if (d) { e.preventDefault(); store.getState().moveMarker(m.id, m.x + d[0], m.y + d[1]); } }}>
          {index + 1}
        </button>)}
      </div>
    </div>
    {marker && <div className={styles.editor} aria-label="Selected marker actions">
      <strong>{markerTypes[marker.type]}</strong>
      <label>Marker Type<select aria-label="Edit marker type" value={marker.type} onChange={e => store.getState().updateMarker(marker.id, { type: e.target.value as MarkerType })}>{Object.entries(markerTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Optional Note<textarea maxLength={2000} value={marker.note ?? ''} onChange={e => store.getState().updateMarker(marker.id, { note: e.target.value })} /></label>
      <div className={styles.row}><button type="button" onClick={() => store.getState().deleteMarker(marker.id)}>Delete Marker</button><button type="button" onClick={() => store.getState().selectMarker(null)}>Done editing</button></div>
    </div>}
  </div>;
}

function ImageWithMarkers({ image }: { image: LesionImage }) {
  const markers = usePhotography(useShallow(s => s.markers.filter(m => m.imageId === image.id)));
  return <div className={styles.imagePlane} style={{ '--image-ratio': image.width / image.height } as React.CSSProperties}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={image.src} alt={image.name} draggable={false} />
    {markers.map((m, index) => <span key={m.id} className={styles.markerDot} title={markerTypes[m.type]} style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, background: colors[m.type] }}>{index + 1}</span>)}
  </div>;
}

function Comparison() {
  const before = usePhotography(selectors.beforeImage); const after = usePhotography(selectors.afterImage);
  const { position, efficacy, dragTarget } = usePhotography(useShallow(s => ({ position: s.comparisonPosition, efficacy: s.efficacyPercentage, dragTarget: s.dragTarget })));
  const { store } = usePhotographySession();
  const frame = useRef<HTMLDivElement>(null); const scrubbing = useRef(false);
  const updatePosition = (e: PointerEvent) => { const rect = frame.current!.getBoundingClientRect(); store.getState().setComparisonPosition((e.clientX - rect.left) / rect.width * 100); };
  return <section className={styles.panel}><h3>Before / After Treatment Comparison Slider</h3>
    <div className={styles.row}><button type="button" disabled={!before && !after} onClick={() => store.getState().swapBeforeAfter()}>⇄ Swap</button><button type="button" onClick={() => store.getState().useAnnotated('before')}>Use Annotated as Before</button><button type="button" onClick={() => store.getState().useAnnotated('after')}>Use Annotated as After</button></div>
    <div className={styles.assignments}>{(['before', 'after'] as const).map(target => <div key={target} className={`${styles.assignment} ${dragTarget === target ? styles.dragActive : ''}`}
      onDragEnter={e => { e.preventDefault(); store.getState().setUI({ dragTarget: target }); }} onDragOver={e => e.preventDefault()}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) store.getState().setUI({ dragTarget: null }); }}
      onDrop={e => { e.preventDefault(); store.getState().setUI({ dragTarget: null }); try { const data = JSON.parse(e.dataTransfer.getData(dragMime)); if (data.consultationId !== store.getState().consultationId) throw new Error(); if (target === 'before') store.getState().setBeforeImage(data.imageId); else store.getState().setAfterImage(data.imageId); } catch { store.getState().reportError('Drag an image from this consultation’s library.'); } }}>
      <strong>{target === 'before' ? 'Before' : 'After'}</strong><span>{(target === 'before' ? before : after)?.name ?? `Assign a ${target} image from the library`}</span><small>Drop a library thumbnail here</small>
    </div>)}</div>
    {before && after ? <div ref={frame} data-testid="comparison-frame" className={styles.comparison}>
      <div className={styles.comparisonLayer}><ImageWithMarkers image={before} /></div>
      <div data-testid="after-layer" className={styles.comparisonLayer} style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}><ImageWithMarkers image={after} /></div>
      <span className={styles.beforeLabel}>BEFORE</span><span className={styles.afterLabel}>AFTER</span>
      <button type="button" className={styles.divider} style={{ left: `${position}%` }} aria-label="Drag comparison divider"
        onPointerDown={e => { scrubbing.current = true; e.currentTarget.setPointerCapture(e.pointerId); updatePosition(e); }} onPointerMove={e => { if (scrubbing.current) updatePosition(e); }}
        onPointerUp={e => { scrubbing.current = false; e.currentTarget.releasePointerCapture(e.pointerId); }} onPointerCancel={() => { scrubbing.current = false; }} onLostPointerCapture={() => { scrubbing.current = false; }}
        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); store.getState().setComparisonPosition(position + (e.key === 'ArrowLeft' ? -1 : 1)); } }}>⇄</button>
    </div> : <div className={styles.empty}>Select both Before and After images to compare treatment photographs.</div>}
    <label className={styles.range}>Image reveal: {Math.round(position)}% After<input aria-label="Comparison position" type="range" min="0" max="100" step="1" value={position} disabled={!before || !after} onChange={e => store.getState().setComparisonPosition(Number(e.target.value))} /></label>
    <div className={styles.presets}>{[0, 25, 50, 75, 100].map(n => <button type="button" key={n} disabled={!before || !after} aria-pressed={position === n} onClick={() => store.getState().setComparisonPosition(n)}>{n === 0 ? '0% Before' : n === 50 ? '50% Split' : n === 100 ? '100% After' : `${n}%`}</button>)}</div>
    <div className={styles.editor}><label>Clinician-recorded efficacy (%)<input type="number" min="0" max="100" step="1" disabled={!before || !after} value={efficacy ?? ''} placeholder="Not recorded" onChange={e => store.getState().setEfficacy(e.target.value === '' ? null : Number(e.target.value))} /></label>
      <p>Manual assessment. Point annotations and image reveal do not calculate lesion area or clinical efficacy. Changing the image pair clears this assessment.</p>
      <strong>Efficacy recorded: {efficacy === null ? 'Not recorded' : `${efficacy}% (manual)`}</strong>
      {efficacy !== null && efficacy >= 80 && <span className={styles.badge}>Marked Clearance (≥80%) — manual assessment</span>}
    </div>
  </section>;
}

function Library({ uploadMore }: { uploadMore: () => void }) {
  const images = usePhotography(s => s.images);
  return <section className={styles.panel}><h3>Consultation Image Library ({images.length})</h3><p>Drag any thumbnail onto Before or After, or use the buttons below each photo.</p><div className={styles.library}>{images.map(image => <Thumbnail key={image.id} image={image} />)}</div><button type="button" onClick={uploadMore}>+ Upload More Photos</button></section>;
}
function Thumbnail({ image }: { image: LesionImage }) {
  const count = usePhotography(s => s.markers.filter(m => m.imageId === image.id).length);
  const selected = usePhotography(s => s.selectedImageId === image.id);
  const { store, controller } = usePhotographySession();
  return <article className={`${styles.thumbnail} ${selected ? styles.activeThumbnail : ''}`} draggable onDragStart={e => { e.dataTransfer.setData(dragMime, JSON.stringify({ consultationId: store.getState().consultationId, imageId: image.id })); e.dataTransfer.effectAllowed = 'copy'; }}>
    <button type="button" className={styles.thumbnailImage} aria-label={`Preview ${image.name}`} onClick={() => store.getState().setUI({ previewImageId: image.id })}>
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src={image.src} alt={image.name} draggable={false} />
    </button><strong>{image.name}</strong><small>{count} markers · {(image.size / 1024 / 1024).toFixed(2)} MB</small>
    {image.uploadStatus === 'uploading' || image.uploadStatus === 'pending' ? <label>Uploading {image.uploadProgress}%<progress max="100" value={image.uploadProgress} /></label> : image.uploadStatus === 'error' ? <div role="alert" className={styles.error}>{image.error}<button type="button" onClick={() => void controller.retryUpload(image.id)}>Retry upload</button></div> : <small>Uploaded</small>}
    <div className={styles.row}><button type="button" aria-pressed={selected} onClick={() => store.getState().selectImage(image.id)}>Select</button><button type="button" onClick={() => store.getState().setUI({ previewImageId: image.id })}>Preview</button><button type="button" onClick={() => store.getState().setBeforeImage(image.id)}>Use as Before</button><button type="button" onClick={() => store.getState().setAfterImage(image.id)}>Use as After</button><button type="button" onClick={() => { if (window.confirm(`Delete ${image.name} and its annotations from this consultation?`)) store.getState().removeImage(image.id); }}>Delete</button></div>
  </article>;
}

function Webcam() {
  const status = usePhotography(s => s.webcamStatus); const { store, controller } = usePhotographySession();
  const video = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null);
  const close = () => { stream.current?.getTracks().forEach(t => t.stop()); store.getState().setUI({ webcamStatus: 'closed' }); };
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support camera access. Use HTTPS and a supported browser, or upload a photo.');
        const media = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) { media.getTracks().forEach(t => t.stop()); return; }
        stream.current = media;
        if (video.current) { video.current.srcObject = media; await video.current.play(); }
        if (!cancelled) store.getState().setUI({ webcamStatus: 'ready' });
      } catch (error) {
        if (cancelled) return;
        stream.current?.getTracks().forEach(t => t.stop());
        const name = error instanceof Error ? error.name : '';
        store.getState().reportError(name === 'NotAllowedError' ? 'Camera permission denied. Allow camera access in your browser or upload a photo.' : name === 'NotFoundError' ? 'No camera is available.' : error instanceof Error ? error.message : 'Unable to open camera.');
        store.getState().setUI({ webcamStatus: 'closed' });
      }
    })();
    return () => { cancelled = true; stream.current?.getTracks().forEach(t => t.stop()); store.getState().setUI({ webcamStatus: 'closed' }); };
  }, [store]);
  const capture = () => {
    const v = video.current; if (!v?.videoWidth || !v.videoHeight) { store.getState().reportError('Wait for the live video before capturing.'); return; }
    const canvas = document.createElement('canvas'); canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d'); if (!ctx) { store.getState().reportError('Photo capture is unavailable in this browser.'); return; }
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(blob => { if (!blob) { store.getState().reportError('Camera photo could not be captured.'); return; } void controller.addFiles([new File([blob], `Webcam-${new Date().toISOString().replaceAll(':', '-')}.jpg`, { type: 'image/jpeg' })], 'WEBCAM'); }, 'image/jpeg', .9);
    close();
  };
  return <Modal title="Live Webcam" close={close}><video ref={video} autoPlay muted playsInline className={styles.video} /><p role="status">{status === 'initializing' ? 'Initializing camera…' : 'Camera ready'}</p><div className={styles.row}><button type="button" disabled={status !== 'ready'} onClick={capture}>Capture Photo</button><button type="button" onClick={close}>Cancel</button></div></Modal>;
}
