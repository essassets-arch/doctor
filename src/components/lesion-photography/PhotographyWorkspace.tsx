'use client';

import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  Camera, Upload, ZoomIn, ZoomOut, RotateCcw, CheckCircle2,
  Trash2, Crosshair, SlidersHorizontal, Layers, Eye, RefreshCw,
  AlertCircle, Sparkles, ArrowLeftRight, Maximize2, X, Plus,
  Check, Image as ImageIcon, Sliders, Info
} from 'lucide-react';
import { markerTypes, selectors, type MarkerType, type LesionImage } from '@/store/lesion-photography';
import { useLesionPhotographyStore as usePhotography, usePhotographySession } from './PhotographyProvider';
import styles from './photography.module.css';

const colors: Record<MarkerType, string> = {
  ERYTHEMA_MARGIN: '#dc2626',
  ACTIVE_INDURATION: '#7c3aed',
  FOLLICULAR_PAPULE: '#0284c7',
  PIGMENTATION_BORDER: '#d97706',
  SCAR_ATROPHY: '#059669'
};

const dragMime = 'application/x-lesion-image';

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.modal}
      onCancel={e => { e.preventDefault(); close(); }}
      aria-label={title}
    >
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>{title}</h3>
        <button type="button" onClick={close} className={styles.modalCloseBtn} aria-label={`Close ${title}`}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function PhotographyWorkspace() {
  const count = usePhotography(selectors.markerCount);
  const { errors, loadStatus, saveStatus, clearConfirmation, previewImageId, webcamStatus } = usePhotography(
    useShallow(s => ({
      errors: s.errors,
      loadStatus: s.loadStatus,
      saveStatus: s.saveStatus,
      clearConfirmation: s.clearConfirmation,
      previewImageId: s.previewImageId,
      webcamStatus: s.webcamStatus
    }))
  );
  const { store, controller } = usePhotographySession();
  const preview = usePhotography(s => s.images.find(i => i.id === s.previewImageId));
  const single = useRef<HTMLInputElement>(null);
  const multiple = useRef<HTMLInputElement>(null);
  const dragTarget = usePhotography(s => s.dragTarget);

  const upload = (files: FileList | null) => {
    if (files) void controller.addFiles(Array.from(files));
  };

  const handleLoadDemo = async () => {
    try {
      store.getState().setUI({ loadStatus: 'loading' });
      const res = await fetch(`/api/consultation/${encodeURIComponent(store.getState().consultationId)}/lesion-photography?reset=demo`, {
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.photography) {
        store.getState().hydrate(data.photography);
      }
    } catch {
      void controller.load();
    }
  };

  return (
    <section className={styles.workspace} aria-label="Lesion photography workspace">
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.headerIcon}>
            <Camera size={22} />
          </div>
          <div>
            <h2 className={styles.headerTitle}>Medical Lesion Photography & Marker Annotation</h2>
            <div className={styles.headerSubtitle}>
              Dermatological macroscopic & dermoscopic photography documentation, precision lesion boundary markers, and longitudinal treatment efficacy tracking.
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.badge}>
            <Crosshair size={13} />
            {count} Markers Placed
          </span>

          <div role="status" aria-live="polite">
            {loadStatus === 'loading' ? (
              <span className={`${styles.statusPill} ${styles.statusSaving}`}>
                <RefreshCw size={13} className="spin" /> Loading photography…
              </span>
            ) : saveStatus === 'saving' ? (
              <span className={`${styles.statusPill} ${styles.statusSaving}`}>
                <RefreshCw size={13} className="spin" /> Saving changes…
              </span>
            ) : saveStatus === 'saved' ? (
              <span className={`${styles.statusPill} ${styles.statusSaved}`}>
                <CheckCircle2 size={13} color="#059669" /> Cloud Synced
              </span>
            ) : saveStatus === 'error' ? (
              <button
                type="button"
                className={`${styles.statusPill} ${styles.statusError}`}
                onClick={() => void controller.save()}
              >
                <AlertCircle size={13} /> Save failed — Retry
              </button>
            ) : (
              <span className={styles.statusPill}>Changes pending</span>
            )}
          </div>
        </div>
      </header>

      {/* Error Notices */}
      {loadStatus === 'error' && (
        <div className={styles.error} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <span>Photography service offline or connection error. Local work is temporary until reconnected.</span>
          </div>
          <button type="button" onClick={() => void controller.load()}>
            Retry loading
          </button>
        </div>
      )}

      {errors.length > 0 && (
        <div className={styles.error} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
            <AlertCircle size={18} style={{ marginTop: 2 }} />
            <ul>
              {errors.map((error, index) => (
                <li key={`${index}-${error}`}>{error}</li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={() => store.getState().setUI({ errors: [] })}>
            Dismiss messages
          </button>
        </div>
      )}

      <fieldset disabled={loadStatus === 'loading'} className={styles.controls}>
        {/* Top Annotation & Upload Controls */}
        <AnnotationToolbar
          onWebcam={() => store.getState().setUI({ webcamStatus: 'initializing' })}
          onUploadSingle={() => single.current?.click()}
          onUploadMultiple={() => multiple.current?.click()}
          onLoadDemo={handleLoadDemo}
        />

        <input
          ref={single}
          data-testid="single-photo-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={e => {
            upload(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={multiple}
          data-testid="multiple-photo-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={e => {
            upload(e.target.files);
            e.target.value = '';
          }}
        />

        {/* Drag & Drop Upload Zone */}
        <button
          type="button"
          className={`${styles.drop} ${dragTarget === 'upload' ? styles.dragActive : ''}`}
          onClick={() => multiple.current?.click()}
          onDragEnter={e => {
            e.preventDefault();
            store.getState().setUI({ dragTarget: 'upload' });
          }}
          onDragOver={e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              store.getState().setUI({ dragTarget: null });
            }
          }}
          onDrop={e => {
            e.preventDefault();
            store.getState().setUI({ dragTarget: null });
            upload(e.dataTransfer.files);
          }}
        >
          <Upload size={28} color="#036d92" />
          <div className={styles.dropTitle}>
            {dragTarget === 'upload' ? 'Release photos to begin upload' : 'Multiple Image Upload & Batch Ingestion'}
          </div>
          <div className={styles.dropSubtitle}>
            Drag & drop patient lesion photographs here, or click to browse files
          </div>
          <div className={styles.dropSpecs}>
            Supported Formats: High-Resolution JPG, PNG, WEBP • Max 10 MB per file
          </div>
        </button>

        {/* Interactive Annotation Canvas */}
        <AnnotationCanvas />

        {/* Clear All Markers button */}
        {count > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => store.getState().setUI({ clearConfirmation: true })}
            >
              <Trash2 size={15} />
              Clear All Markers ({count})
            </button>
          </div>
        )}

        {/* Comparison Suite */}
        <Comparison />

        {/* Consultation Image Library */}
        <Library uploadMore={() => multiple.current?.click()} />
      </fieldset>

      {/* Confirmation Modal */}
      {clearConfirmation && (
        <Modal
          title="Clear all markers?"
          close={() => store.getState().setUI({ clearConfirmation: false })}
        >
          <p style={{ color: '#475569', margin: '0 0 20px' }}>
            Are you sure you want to remove all <strong>{count}</strong> markers across this consultation? The uploaded photographs will remain intact in your library.
          </p>
          <div className={styles.row} style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className={styles.btn}
              onClick={() => store.getState().setUI({ clearConfirmation: false })}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => store.getState().clearAllMarkers()}
            >
              <Trash2 size={15} />
              Confirm Clear Markers
            </button>
          </div>
        </Modal>
      )}

      {/* Image Preview Modal */}
      {previewImageId && preview && (
        <Modal
          title={`Clinical Preview: ${preview.name}`}
          close={() => store.getState().setUI({ previewImageId: null })}
        >
          <div style={{ maxHeight: '70vh', overflow: 'auto', background: '#090d16', borderRadius: 8 }}>
            <ImageWithMarkers image={preview} />
          </div>
        </Modal>
      )}

      {/* Webcam Modal */}
      {webcamStatus !== 'closed' && <Webcam />}
    </section>
  );
}

function AnnotationToolbar({
  onWebcam,
  onUploadSingle,
  onUploadMultiple,
  onLoadDemo
}: {
  onWebcam: () => void;
  onUploadSingle: () => void;
  onUploadMultiple: () => void;
  onLoadDemo: () => void;
}) {
  const { selectedMarkerType, annotationMode, zoom } = usePhotography(
    useShallow(s => ({
      selectedMarkerType: s.selectedMarkerType,
      annotationMode: s.annotationMode,
      zoom: s.zoom
    }))
  );
  const { store } = usePhotographySession();

  return (
    <div className={styles.toolbarCard} role="toolbar" aria-label="Annotation tools">
      {/* Marker Tool Selection */}
      <div className={styles.row}>
        <button
          type="button"
          aria-pressed={annotationMode}
          className={`${styles.btn} ${annotationMode ? styles.btnActive : styles.btnPrimary}`}
          onClick={() => store.getState().setUI({ annotationMode: !annotationMode })}
        >
          <Crosshair size={16} />
          <span>{annotationMode ? 'Marker Tool Active (Click Image)' : 'Add Marker'}</span>
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#334155' }}>
          <span>Marker:</span>
          <select
            className={styles.select}
            aria-label="Marker type"
            value={selectedMarkerType}
            onChange={e => store.getState().setSelectedMarkerType(e.target.value as MarkerType)}
          >
            {Object.entries(markerTypes).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {/* Zoom Controls */}
        <div className={styles.zoomGroup}>
          <button
            type="button"
            className={styles.zoomBtn}
            aria-label="Zoom out"
            disabled={zoom <= 1}
            onClick={() => store.getState().setUI({ zoom: Math.max(1, zoom - 0.25) })}
          >
            <ZoomOut size={15} />
          </button>
          <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className={styles.zoomBtn}
            aria-label="Zoom in"
            disabled={zoom >= 3}
            onClick={() => store.getState().setUI({ zoom: Math.min(3, zoom + 0.25) })}
          >
            <ZoomIn size={15} />
          </button>
        </div>

        <button
          type="button"
          className={styles.btn}
          disabled={zoom === 1}
          onClick={() => store.getState().setUI({ zoom: 1 })}
          title="Reset zoom to 100%"
        >
          <RotateCcw size={14} />
          <span>Reset Zoom</span>
        </button>
      </div>

      {/* Ingestion Actions */}
      <div className={styles.row}>
        <button type="button" className={styles.btn} onClick={onWebcam}>
          <Camera size={15} color="#036d92" />
          <span>Live Webcam</span>
        </button>

        <button type="button" className={styles.btn} onClick={onUploadSingle}>
          <Upload size={15} color="#036d92" />
          <span>+ Upload Photo</span>
        </button>

        <button type="button" className={styles.btn} onClick={onUploadMultiple}>
          <Plus size={15} color="#036d92" />
          <span>+ Upload Multiple</span>
        </button>
      </div>
    </div>
  );
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

  const point = (e: PointerEvent) => {
    const rect = plane.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  const marker = markers.find(m => m.id === selectedMarkerId);

  if (!image) {
    return (
      <div className={styles.empty}>
        <ImageIcon size={48} color="#94a3b8" />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
          No photograph selected for annotation
        </div>
        <div style={{ fontSize: 13, maxWidth: 440 }}>
          Upload patient lesion photos above, or click any photo in the Consultation Image Library below to begin placing clinical markers.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            <ImageIcon size={18} color="#036d92" />
            Annotating: {image.name}
          </h3>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {annotationMode
              ? 'Click or tap anywhere on the lesion image to place a marker. Drag existing pins to reposition.'
              : 'Toggle "Add Marker" to place new pins. Select any marker below to edit clinical notes.'}
          </div>
        </div>
        <span className={styles.badge}>{markers.length} Markers on Image</span>
      </div>

      <div className={styles.viewport}>
        <div
          ref={plane}
          data-testid="annotation-image"
          className={styles.imagePlane}
          style={{
            width: `${zoom * 100}%`,
            cursor: annotationMode ? 'crosshair' : 'default'
          }}
          onPointerDown={e => {
            if (!e.isPrimary || e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
            const p = point(e);
            store.getState().addMarker(p.x, p.y);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.name}
            draggable={false}
            onError={() => store.getState().reportError(`Unable to display ${image.name}. Try reloading the image service.`)}
          />

          {markers.map((m, index) => (
            <button
              type="button"
              key={m.id}
              className={`${styles.marker} ${selectedMarkerId === m.id ? styles.selected : ''}`}
              style={{
                left: `${m.x * 100}%`,
                top: `${m.y * 100}%`,
                background: colors[m.type]
              }}
              title={`${index + 1}. ${markerTypes[m.type]}${m.note ? `: ${m.note}` : ''}`}
              aria-label={`Marker ${index + 1}: ${markerTypes[m.type]}`}
              aria-pressed={selectedMarkerId === m.id}
              onClick={e => {
                e.stopPropagation();
                store.getState().selectMarker(m.id);
              }}
              onPointerDown={e => {
                if (!e.isPrimary || e.button !== 0) return;
                e.stopPropagation();
                dragging.current = m.id;
                e.currentTarget.setPointerCapture(e.pointerId);
                store.getState().selectMarker(m.id);
              }}
              onPointerMove={e => {
                if (dragging.current !== m.id) return;
                e.stopPropagation();
                const p = point(e);
                store.getState().moveMarker(m.id, p.x, p.y);
              }}
              onPointerUp={e => {
                dragging.current = null;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={() => {
                dragging.current = null;
              }}
              onLostPointerCapture={() => {
                dragging.current = null;
              }}
              onKeyDown={e => {
                const deltas: Record<string, [number, number]> = {
                  ArrowLeft: [-0.005, 0],
                  ArrowRight: [0.005, 0],
                  ArrowUp: [0, -0.005],
                  ArrowDown: [0, 0.005]
                };
                const d = deltas[e.key];
                if (d) {
                  e.preventDefault();
                  store.getState().moveMarker(m.id, m.x + d[0], m.y + d[1]);
                }
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Marker Editor Drawer */}
      {marker && (
        <div className={styles.editor} aria-label="Selected marker actions">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: colors[marker.type]
                }}
              />
              <strong style={{ fontSize: 14, color: '#0f172a' }}>
                Editing Marker: {markerTypes[marker.type]}
              </strong>
            </div>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => store.getState().selectMarker(null)}
              title="Close marker editor"
            >
              <X size={18} />
            </button>
          </div>

          <label>
            <span>Marker Type / Clinical Finding:</span>
            <select
              className={styles.select}
              aria-label="Edit marker type"
              value={marker.type}
              onChange={e => store.getState().updateMarker(marker.id, { type: e.target.value as MarkerType })}
            >
              {Object.entries(markerTypes).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Clinical Findings & Anatomical Note:</span>
            <textarea
              maxLength={2000}
              placeholder="e.g. 8mm induration with active border erythema on right mandibular cheek..."
              value={marker.note ?? ''}
              onChange={e => store.getState().updateMarker(marker.id, { note: e.target.value })}
            />
          </label>

          <div className={styles.row} style={{ justifyContent: 'space-between', marginTop: 4 }}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => store.getState().deleteMarker(marker.id)}
            >
              <Trash2 size={14} />
              Delete Marker
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => store.getState().selectMarker(null)}
            >
              <Check size={14} />
              Done Editing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageWithMarkers({ image }: { image: LesionImage }) {
  const markers = usePhotography(useShallow(s => s.markers.filter(m => m.imageId === image.id)));

  return (
    <div
      className={styles.imagePlane}
      style={{ '--image-ratio': image.width / image.height } as React.CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.src} alt={image.name} draggable={false} />
      {markers.map((m, index) => (
        <span
          key={m.id}
          className={styles.markerDot}
          title={markerTypes[m.type]}
          style={{
            left: `${m.x * 100}%`,
            top: `${m.y * 100}%`,
            background: colors[m.type]
          }}
        >
          {index + 1}
        </span>
      ))}
    </div>
  );
}

function Comparison() {
  const before = usePhotography(selectors.beforeImage);
  const after = usePhotography(selectors.afterImage);
  const { position, efficacy, dragTarget } = usePhotography(
    useShallow(s => ({
      position: s.comparisonPosition,
      efficacy: s.efficacyPercentage,
      dragTarget: s.dragTarget
    }))
  );
  const { store } = usePhotographySession();
  const frame = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);

  const updatePosition = (e: PointerEvent) => {
    const rect = frame.current!.getBoundingClientRect();
    store.getState().setComparisonPosition(((e.clientX - rect.left) / rect.width) * 100);
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            <SlidersHorizontal size={18} color="#036d92" />
            Before / After Treatment Comparison Slider
          </h3>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Interactive dual-layer slider comparing baseline pre-treatment photographs against post-procedure outcomes.
          </div>
        </div>

        <div className={styles.row}>
          <button
            type="button"
            className={styles.btn}
            disabled={!before && !after}
            onClick={() => store.getState().swapBeforeAfter()}
          >
            <ArrowLeftRight size={14} />
            <span>Swap Positions</span>
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => store.getState().useAnnotated('before')}
          >
            Use Active as Before
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => store.getState().useAnnotated('after')}
          >
            Use Active as After
          </button>
        </div>
      </div>

      {/* Target Slots */}
      <div className={styles.assignments}>
        {(['before', 'after'] as const).map(target => {
          const img = target === 'before' ? before : after;
          return (
            <div
              key={target}
              className={`${styles.assignment} ${dragTarget === target ? styles.dragActive : ''}`}
              onDragEnter={e => {
                e.preventDefault();
                store.getState().setUI({ dragTarget: target });
              }}
              onDragOver={e => e.preventDefault()}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  store.getState().setUI({ dragTarget: null });
                }
              }}
              onDrop={e => {
                e.preventDefault();
                store.getState().setUI({ dragTarget: null });
                try {
                  const data = JSON.parse(e.dataTransfer.getData(dragMime));
                  if (data.consultationId !== store.getState().consultationId) throw new Error();
                  if (target === 'before') store.getState().setBeforeImage(data.imageId);
                  else store.getState().setAfterImage(data.imageId);
                } catch {
                  store.getState().reportError('Drag an image from this consultation’s library.');
                }
              }}
            >
              <strong>{target === 'before' ? 'Baseline (Before)' : 'Outcome (After)'}</strong>
              <span>{img?.name ?? `Assign a ${target} image from library`}</span>
              <small>{img ? `${img.width}×${img.height} • Uploaded` : 'Drop a library thumbnail here'}</small>
            </div>
          );
        })}
      </div>

      {/* Comparison Frame */}
      {before && after ? (
        <div ref={frame} data-testid="comparison-frame" className={styles.comparison}>
          <div className={styles.comparisonLayer}>
            <ImageWithMarkers image={before} />
          </div>
          <div
            data-testid="after-layer"
            className={styles.comparisonLayer}
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            <ImageWithMarkers image={after} />
          </div>

          <span className={styles.beforeLabel}>BEFORE</span>
          <span className={styles.afterLabel}>AFTER</span>

          <button
            type="button"
            className={styles.divider}
            style={{ left: `${position}%` }}
            aria-label="Drag comparison divider"
            onPointerDown={e => {
              scrubbing.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              updatePosition(e);
            }}
            onPointerMove={e => {
              if (scrubbing.current) updatePosition(e);
            }}
            onPointerUp={e => {
              scrubbing.current = false;
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              scrubbing.current = false;
            }}
            onLostPointerCapture={() => {
              scrubbing.current = false;
            }}
            onKeyDown={e => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                store.getState().setComparisonPosition(position + (e.key === 'ArrowLeft' ? -1 : 1));
              }
            }}
          >
            <ArrowLeftRight size={16} />
          </button>
        </div>
      ) : (
        <div className={styles.empty}>
          <SlidersHorizontal size={40} color="#94a3b8" />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
            Select both Before and After photographs to activate comparison slider
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Use the "Use Active as Before / After" buttons above or drag photographs from the library.
          </div>
        </div>
      )}

      {/* Slider Range & Presets */}
      <label className={styles.range}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Image Reveal Position:</span>
          <strong>{Math.round(position)}% After</strong>
        </div>
        <input
          aria-label="Comparison position"
          type="range"
          min="0"
          max="100"
          step="1"
          value={position}
          disabled={!before || !after}
          onChange={e => store.getState().setComparisonPosition(Number(e.target.value))}
        />
      </label>

      <div className={styles.presets}>
        {[0, 25, 50, 75, 100].map(n => (
          <button
            type="button"
            key={n}
            disabled={!before || !after}
            aria-pressed={position === n}
            className={styles.presetBtn}
            onClick={() => store.getState().setComparisonPosition(n)}
          >
            {n === 0 ? '0% Before' : n === 50 ? '50% Split' : n === 100 ? '100% After' : `${n}%`}
          </button>
        ))}
      </div>

      {/* Clinician Efficacy Assessment */}
      <div className={styles.editor}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <label style={{ margin: 0 }}>
            <span>Clinician-Recorded Treatment Clearance & Efficacy (%):</span>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              disabled={!before || !after}
              value={efficacy ?? ''}
              placeholder="e.g. 85"
              className={styles.select}
              style={{ width: 140, marginTop: 4 }}
              onChange={e => store.getState().setEfficacy(e.target.value === '' ? null : Number(e.target.value))}
            />
          </label>

          {efficacy !== null && efficacy >= 80 && (
            <span className={styles.badge} style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
              <Sparkles size={14} />
              Marked Clearance (≥80%) — Excellent Clinical Response
            </span>
          )}
        </div>

        <div style={{ fontSize: 11.5, color: '#64748b' }}>
          Manual assessment. Point annotations and image reveal do not calculate lesion area or clinical efficacy automatically. Changing the image pair clears this assessment.
        </div>
      </div>
    </section>
  );
}

function Library({ uploadMore }: { uploadMore: () => void }) {
  const images = usePhotography(s => s.images);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            <Layers size={18} color="#036d92" />
            Consultation Image Library ({images.length} Photos)
          </h3>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Drag any thumbnail onto Before or After slots, or use the quick assignment buttons below each photograph.
          </div>
        </div>

        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={uploadMore}>
          <Upload size={14} />
          <span>+ Upload More Photos</span>
        </button>
      </div>

      <div className={styles.library}>
        {images.map(image => (
          <Thumbnail key={image.id} image={image} />
        ))}
      </div>
    </section>
  );
}

function Thumbnail({ image }: { image: LesionImage }) {
  const count = usePhotography(s => s.markers.filter(m => m.imageId === image.id).length);
  const selected = usePhotography(s => s.selectedImageId === image.id);
  const { store, controller } = usePhotographySession();

  return (
    <article
      className={`${styles.thumbnail} ${selected ? styles.activeThumbnail : ''}`}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData(
          dragMime,
          JSON.stringify({
            consultationId: store.getState().consultationId,
            imageId: image.id
          })
        );
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <button
        type="button"
        className={styles.thumbnailImage}
        aria-label={`Preview ${image.name}`}
        onClick={() => store.getState().setUI({ previewImageId: image.id })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.name} draggable={false} />
      </button>

      <div className={styles.thumbnailMeta}>
        <div className={styles.thumbnailName} title={image.name}>
          {image.name}
        </div>
        <div className={styles.thumbnailDetails}>
          <span>{count} markers</span>
          <span>•</span>
          <span>{(image.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>

      {image.uploadStatus === 'uploading' || image.uploadStatus === 'pending' ? (
        <label style={{ fontSize: 11, color: '#036d92', fontWeight: 600 }}>
          Uploading {image.uploadProgress}%
          <progress
            max="100"
            value={image.uploadProgress}
            style={{ width: '100%', height: 6, marginTop: 4 }}
          />
        </label>
      ) : image.uploadStatus === 'error' ? (
        <div role="alert" className={styles.error} style={{ padding: '6px 10px', fontSize: 11 }}>
          <span>{image.error}</span>
          <button type="button" onClick={() => void controller.retryUpload(image.id)}>
            Retry
          </button>
        </div>
      ) : null}

      <div className={styles.thumbnailActions}>
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => store.getState().selectImage(image.id)}
          title="Select this image for marker annotation"
        >
          {selected ? '✓ Active' : 'Annotate'}
        </button>

        <button
          type="button"
          onClick={() => store.getState().setUI({ previewImageId: image.id })}
          title="Open high-res lightbox preview"
        >
          Preview
        </button>

        <button
          type="button"
          onClick={() => store.getState().setBeforeImage(image.id)}
          title="Assign as baseline Before image"
        >
          As Before
        </button>

        <button
          type="button"
          onClick={() => store.getState().setAfterImage(image.id)}
          title="Assign as outcome After image"
        >
          As After
        </button>

        <button
          type="button"
          style={{ gridColumn: 'span 2', color: '#dc2626' }}
          onClick={() => {
            if (window.confirm(`Delete ${image.name} and its markers from this consultation?`)) {
              store.getState().removeImage(image.id);
            }
          }}
        >
          Delete Photo
        </button>
      </div>
    </article>
  );
}

function Webcam() {
  const status = usePhotography(s => s.webcamStatus);
  const { store, controller } = usePhotographySession();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  const close = () => {
    stream.current?.getTracks().forEach(t => t.stop());
    store.getState().setUI({ webcamStatus: 'closed' });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('This browser does not support camera access. Use HTTPS and a supported browser, or upload a photo.');
        }
        const media = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          media.getTracks().forEach(t => t.stop());
          return;
        }
        stream.current = media;
        if (video.current) {
          video.current.srcObject = media;
          await video.current.play();
        }
        if (!cancelled) store.getState().setUI({ webcamStatus: 'ready' });
      } catch (error) {
        if (cancelled) return;
        stream.current?.getTracks().forEach(t => t.stop());
        const name = error instanceof Error ? error.name : '';
        store.getState().reportError(
          name === 'NotAllowedError'
            ? 'Camera permission denied. Allow camera access in your browser or upload a photo.'
            : name === 'NotFoundError'
            ? 'No camera is available.'
            : error instanceof Error
            ? error.message
            : 'Unable to open camera.'
        );
        store.getState().setUI({ webcamStatus: 'closed' });
      }
    })();

    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach(t => t.stop());
      store.getState().setUI({ webcamStatus: 'closed' });
    };
  }, [store]);

  const capture = () => {
    const v = video.current;
    if (!v?.videoWidth || !v.videoHeight) {
      store.getState().reportError('Wait for the live video before capturing.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      store.getState().reportError('Photo capture is unavailable in this browser.');
      return;
    }
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(
      blob => {
        if (!blob) {
          store.getState().reportError('Camera photo could not be captured.');
          return;
        }
        void controller.addFiles(
          [
            new File(
              [blob],
              `Webcam-${new Date().toISOString().replaceAll(':', '-')}.jpg`,
              { type: 'image/jpeg' }
            )
          ],
          'WEBCAM'
        );
      },
      'image/jpeg',
      0.9
    );
    close();
  };

  return (
    <Modal title="Live Clinical Webcam Capture" close={close}>
      <video ref={video} autoPlay muted playsInline className={styles.video} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          {status === 'initializing' ? 'Initializing optical video sensor…' : 'Camera stream active'}
        </p>
        <span className={styles.badge}>
          <Camera size={13} /> High-Res Frame Ready
        </span>
      </div>
      <div className={styles.row} style={{ justifyContent: 'flex-end' }}>
        <button type="button" className={styles.btn} onClick={close}>
          Cancel
        </button>
        <button
          type="button"
          disabled={status !== 'ready'}
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={capture}
        >
          <Camera size={15} />
          Capture Photograph
        </button>
      </div>
    </Modal>
  );
}
