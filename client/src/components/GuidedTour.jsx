import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

/**
 * GuidedTour – lightweight, reusable step-by-step tour overlay.
 *
 * Props
 * ─────
 *  steps        – Array of { target, title, description, placement? }
 *                 `target` is a CSS selector (e.g. '[data-tour="search-bar"]')
 *                 `placement` is optional: 'top' | 'bottom' | 'left' | 'right' (auto-chosen if omitted)
 *  storageKey   – localStorage key used to persist "tour completed" state
 *  onFinish     – optional callback when tour completes or is skipped
 *  accentColor  – optional brand color (default '#EA580C')
 *  isDarkMode   – whether the app is in dark mode
 */
export default function GuidedTour({
  steps = [],
  storageKey,
  onFinish,
  accentColor = '#EA580C',
  isDarkMode = false,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const [targetEl, setTargetEl] = useState(null);
  const tooltipRef = useRef(null);
  const rafRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // ── Determine if tour should show ──────────────────────────────────────────
  useEffect(() => {
    if (!storageKey || !steps.length) return;
    const done = localStorage.getItem(storageKey);
    if (!done) setIsActive(true);
  }, [storageKey, steps.length]);

  // ── Find & measure target element ──────────────────────────────────────────
  const measureTarget = useCallback(() => {
    if (!isActive || !steps[currentStep]) return;
    const selector = steps[currentStep].target;
    const el = selector ? document.querySelector(selector) : null;
    setTargetEl(el);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
    } else {
      setTargetRect(null);
    }
  }, [isActive, currentStep, steps]);

  // ── Live repositioning on scroll / resize ──────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const tick = () => {
      measureTarget();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Also observe resize of the document body
    resizeObserverRef.current = new ResizeObserver(() => measureTarget());
    resizeObserverRef.current.observe(document.body);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserverRef.current?.disconnect();
    };
  }, [isActive, measureTarget]);

  // ── Scroll target into view ────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || !targetEl) return;
    // Small delay to let the DOM settle
    const t = setTimeout(() => {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }, 100);
    return () => clearTimeout(t);
  }, [isActive, targetEl, currentStep]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const finish = useCallback(() => {
    setIsActive(false);
    if (storageKey) localStorage.setItem(storageKey, 'true');
    onFinish?.();
  }, [storageKey, onFinish]);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
    else finish();
  }, [currentStep, steps.length, finish]);

  const back = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  const skip = useCallback(() => finish(), [finish]);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;
    const onKey = (e) => {
      if (e.key === 'Escape') skip();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isActive, next, back, skip]);

  // ── Compute tooltip placement ──────────────────────────────────────────────
  const placement = useMemo(() => {
    const step = steps[currentStep];
    if (!step) return 'bottom';
    if (step.placement) return step.placement;
    if (!targetRect) return 'bottom';

    const vp = { w: window.innerWidth, h: window.innerHeight };
    const spaceBelow = vp.h - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const spaceRight = vp.w - targetRect.right;
    const spaceLeft = targetRect.left;

    // Prefer bottom, then top, then right, then left
    if (spaceBelow >= 180) return 'bottom';
    if (spaceAbove >= 180) return 'top';
    if (spaceRight >= 280) return 'right';
    if (spaceLeft >= 280) return 'left';
    return 'bottom';
  }, [steps, currentStep, targetRect]);

  // ── Tooltip position ──────────────────────────────────────────────────────
  const tooltipStyle = useMemo(() => {
    if (!targetRect) {
      // Center in viewport (no target found)
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100002,
      };
    }

    const gap = 16; // distance from spotlight to tooltip
    const arrowSize = 10;
    const totalGap = gap + arrowSize;
    const style = { position: 'fixed', zIndex: 100002 };

    const centerX = targetRect.left + targetRect.width / 2;
    const centerY = targetRect.top + targetRect.height / 2;

    switch (placement) {
      case 'bottom':
        style.top = targetRect.bottom + totalGap;
        style.left = Math.max(16, Math.min(centerX, window.innerWidth - 16));
        style.transform = 'translateX(-50%)';
        break;
      case 'top':
        style.bottom = window.innerHeight - targetRect.top + totalGap;
        style.left = Math.max(16, Math.min(centerX, window.innerWidth - 16));
        style.transform = 'translateX(-50%)';
        break;
      case 'right':
        style.left = targetRect.right + totalGap;
        style.top = Math.max(16, Math.min(centerY, window.innerHeight - 16));
        style.transform = 'translateY(-50%)';
        break;
      case 'left':
        style.right = window.innerWidth - targetRect.left + totalGap;
        style.top = Math.max(16, Math.min(centerY, window.innerHeight - 16));
        style.transform = 'translateY(-50%)';
        break;
      default:
        break;
    }
    return style;
  }, [targetRect, placement]);

  // ── Arrow position (points FROM tooltip TOWARD target) ─────────────────────
  const arrowStyle = useMemo(() => {
    if (!targetRect) return { display: 'none' };

    const style = { position: 'absolute', zIndex: 100003 };

    switch (placement) {
      case 'bottom':
        // arrow sits above tooltip pointing up at target
        style.top = '-10px';
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        break;
      case 'top':
        style.bottom = '-10px';
        style.left = '50%';
        style.transform = 'translateX(-50%) rotate(180deg)';
        break;
      case 'right':
        style.left = '-10px';
        style.top = '50%';
        style.transform = 'translateY(-50%) rotate(90deg)';
        break;
      case 'left':
        style.right = '-10px';
        style.top = '50%';
        style.transform = 'translateY(-50%) rotate(-90deg)';
        break;
      default:
        break;
    }
    return style;
  }, [targetRect, placement]);

  // ── Clamp tooltip to viewport ──────────────────────────────────────────────
  useEffect(() => {
    if (!tooltipRef.current || !isActive) return;
    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();
    const pad = 12;

    if (rect.right > window.innerWidth - pad) {
      el.style.left = `${window.innerWidth - rect.width - pad}px`;
      el.style.transform = 'none';
    }
    if (rect.left < pad) {
      el.style.left = `${pad}px`;
      el.style.transform = 'none';
    }
    if (rect.bottom > window.innerHeight - pad) {
      el.style.top = `${window.innerHeight - rect.height - pad}px`;
      if (el.style.transform === 'translateY(-50%)') el.style.transform = 'none';
    }
    if (rect.top < pad) {
      el.style.top = `${pad}px`;
      if (el.style.transform === 'translateY(-50%)') el.style.transform = 'none';
    }
  });

  // ── Don't render when inactive ─────────────────────────────────────────────
  if (!isActive || !steps.length) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const hasTarget = !!targetRect;

  const spotlightPad = 8;
  const spotlightRadius = 12;

  // Colors
  const bgCard = isDarkMode ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#F5F5F5' : '#171717';
  const textSecondary = isDarkMode ? '#A0A0A0' : '#6B7280';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E5E7EB';

  return createPortal(
    <div className="guided-tour-root" aria-live="polite" role="dialog" aria-label="Guided tour">

      {/* ── Overlay with spotlight cutout ───────────────────────────────── */}
      <div
        className="guided-tour-overlay"
        onClick={skip}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100000,
          pointerEvents: 'auto',
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id="guided-tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {hasTarget && (
                <rect
                  x={targetRect.left - spotlightPad}
                  y={targetRect.top - spotlightPad}
                  width={targetRect.width + spotlightPad * 2}
                  height={targetRect.height + spotlightPad * 2}
                  rx={spotlightRadius}
                  ry={spotlightRadius}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask="url(#guided-tour-mask)"
          />
        </svg>
      </div>

      {/* ── Spotlight glow ring ─────────────────────────────────────────── */}
      {hasTarget && (
        <div
          className="guided-tour-spotlight"
          style={{
            position: 'fixed',
            top: targetRect.top - spotlightPad,
            left: targetRect.left - spotlightPad,
            width: targetRect.width + spotlightPad * 2,
            height: targetRect.height + spotlightPad * 2,
            borderRadius: spotlightRadius,
            border: `2px solid ${accentColor}`,
            boxShadow: `0 0 0 4px ${accentColor}20, 0 0 24px ${accentColor}30`,
            zIndex: 100001,
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}

      {/* ── Allow click-through to the highlighted element ─────────────── */}
      {hasTarget && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - spotlightPad,
            left: targetRect.left - spotlightPad,
            width: targetRect.width + spotlightPad * 2,
            height: targetRect.height + spotlightPad * 2,
            borderRadius: spotlightRadius,
            zIndex: 100001,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── Tooltip card ───────────────────────────────────────────────── */}
      <div
        ref={tooltipRef}
        className="guided-tour-tooltip"
        style={{
          ...tooltipStyle,
          width: 'min(340px, calc(100vw - 32px))',
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: 16,
          padding: 0,
          boxShadow: isDarkMode
            ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow triangle */}
        {hasTarget && (
          <div style={arrowStyle}>
            <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
              <path d="M10 0L20 10H0L10 0Z" fill={bgCard} />
              <path d="M10 0.5L19 10H1L10 0.5Z" stroke={borderColor} strokeWidth="0.5" fill={bgCard} />
            </svg>
          </div>
        )}

        {/* Step progress bar */}
        <div style={{
          padding: '16px 20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentStep ? 24 : 8,
                  height: 4,
                  borderRadius: 2,
                  background: i <= currentStep ? accentColor : (isDarkMode ? '#333' : '#E5E7EB'),
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: textSecondary }}>
            {currentStep + 1}/{steps.length}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px' }}>
          <h3 style={{
            fontSize: 15,
            fontWeight: 700,
            color: textPrimary,
            marginBottom: 6,
            lineHeight: 1.3,
          }}>
            {step.title}
          </h3>
          <p style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: textSecondary,
            margin: 0,
          }}>
            {step.description}
          </p>
          {!hasTarget && step.target && (
            <p style={{
              fontSize: 11,
              color: isDarkMode ? '#666' : '#9CA3AF',
              marginTop: 8,
              fontStyle: 'italic',
            }}>
              This element is not visible on the current page.
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: '0 20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <button
            onClick={skip}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: textSecondary,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 8,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.color = textPrimary}
            onMouseLeave={(e) => e.target.style.color = textSecondary}
          >
            Skip
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {currentStep > 0 && (
              <button
                onClick={back}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: textPrimary,
                  background: isDarkMode ? '#252525' : '#F5F5F5',
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}
            <button
              onClick={next}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                background: accentColor,
                border: 'none',
                borderRadius: 10,
                padding: '8px 18px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 2px 8px ${accentColor}40`,
              }}
            >
              {isLastStep ? (
                <>
                  <Check size={14} />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Animated directional arrow pointing at target ───────────────── */}
      {hasTarget && (
        <div
          className="guided-tour-arrow-pointer"
          style={{
            position: 'fixed',
            zIndex: 100004,
            pointerEvents: 'none',
            ...getArrowPointerPosition(targetRect, placement, spotlightPad),
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: `drop-shadow(0 2px 6px ${accentColor}50)`,
            }}
          >
            <path
              d="M14 4L14 20M14 20L8 14M14 20L20 14"
              stroke={accentColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>,
    document.body
  );
}

/**
 * Returns style for the animated arrow that visually points from outside the
 * spotlight toward the centre of the target element.
 */
function getArrowPointerPosition(rect, placement, pad) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  switch (placement) {
    case 'bottom':
      return {
        left: centerX - 14,
        top: rect.top - pad - 32,
        transform: 'rotate(180deg)',
      };
    case 'top':
      return {
        left: centerX - 14,
        top: rect.bottom + pad + 4,
        transform: 'rotate(0deg)',
      };
    case 'right':
      return {
        left: rect.left - pad - 32,
        top: centerY - 14,
        transform: 'rotate(90deg)',
      };
    case 'left':
      return {
        left: rect.right + pad + 4,
        top: centerY - 14,
        transform: 'rotate(-90deg)',
      };
    default:
      return {};
  }
}
