import { useEffect } from 'react';

export default function NoBounceBehavior() {
  useEffect(() => {
    // Detect if we're on macOS Safari/Chrome
    const isMacOS = navigator.platform.indexOf('Mac') > -1 || 
                    (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    
    if (isMacOS) {
      // MacOS-specific solution
      document.documentElement.classList.add('mac-os');
      
      // Add CSS rules dynamically
      const style = document.createElement('style');
      style.textContent = `
        .mac-os * {
          overscroll-behavior: none !important;
          -webkit-overflow-scrolling: auto !important;
        }
        .mac-os body {
          position: fixed;
          width: 100%;
          overflow: hidden;
        }
        .mac-os [data-scrollable] {
          overflow-y: auto;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          -webkit-overflow-scrolling: touch;
        }
      `;
      document.head.appendChild(style);
      
      // Add data-scrollable attribute to main scrollable elements
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.setAttribute('data-scrollable', 'true');
      }
      
      return () => {
        document.documentElement.classList.remove('mac-os');
        document.head.removeChild(style);
      };
    }
    
    // Original implementation for other platforms
    const handleTouchMove = (e) => {
      // Check if the element or any of its parents has scrollable content
      let target = e.target;
      while (target !== document.body && target !== null) {
        const style = window.getComputedStyle(target);
        const isScrollable = style.getPropertyValue('overflow-y') === 'auto' || 
                             style.getPropertyValue('overflow-y') === 'scroll';
        
        if (isScrollable) {
          // If the element is scrollable and at the top/bottom boundary, prevent default
          if ((target.scrollTop <= 0 && e.touches[0].screenY > e.touches[0].screenX) ||
              (target.scrollHeight - target.scrollTop <= target.clientHeight && 
               e.touches[0].screenY < e.touches[0].screenX)) {
            e.preventDefault();
          }
          return;
        }
        target = target.parentNode;
      }
      
      // If we get here, no scrollable parent was found
      e.preventDefault();
    };

    // Apply fixes
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.touchAction = 'none';
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      // Cleanup
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
      
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return null;
} 