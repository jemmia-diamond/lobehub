'use client';

import { memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Desktop-only bootstrap: force reset to home on hard browser reload.
 *
 * This ensures that a "Fresh Start" welcome state is always shown when
 * the application is first opened or force-reloaded.
 */
const DesktopAutoResetOnFirstOpen = memo(() => {
  const navigate = useNavigate();

  useEffect(() => {
    // If the path is not already Home, or if there are query parameters (like ?topic=),
    // force a navigate to '/' to clean the state.
    if (window.location.pathname !== '/' || window.location.search !== '') {
      console.info('[DesktopAutoReset] Hard reload detected. Redirecting to home for fresh start.');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return null;
});

export default DesktopAutoResetOnFirstOpen;
