'use client';

<<<<<<< HEAD
import { DraggablePanel, Freeze } from '@lobehub/ui';
import { createStaticStyles  } from 'antd-style';
import { AnimatePresence,motion, useIsPresent } from 'motion/react';
||||||| cd49e98936
import { DraggablePanel, Freeze } from '@lobehub/ui';
import { createStaticStyles, cssVar } from 'antd-style';
import { AnimatePresence, m, useIsPresent } from 'motion/react';
=======
import { DraggablePanel } from '@lobehub/ui';
import { createStaticStyles, cssVar } from 'antd-style';
>>>>>>> 1005f442d6cc7eeb5b43d94e0a396867226f06cb
import { type ReactNode } from 'react';
import { memo, Suspense, useMemo, useRef } from 'react';

import Footer from '@/routes/(main)/home/_layout/Footer';
import { USER_DROPDOWN_ICON_ID } from '@/routes/(main)/home/_layout/Header/components/User';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
<<<<<<< HEAD
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';
||||||| cd49e98936
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';
import { isMacOS } from '@/utils/platform';
=======
import { isMacOS } from '@/utils/platform';
>>>>>>> 1005f442d6cc7eeb5b43d94e0a396867226f06cb

// import { useNavPanelSizeChangeHandler } from '../hooks/useNavPanel';
import { BACK_BUTTON_ID } from './BackButton';

const draggableStyles = createStaticStyles(({ css, cssVar }) => ({
  content: css`
    position: relative;

    overflow: hidden;
    display: flex;
    flex-direction: column;

    height: 100%;
    min-height: 100%;
    max-height: 100%;
  `,
  inner: css`
    position: relative;

    overflow: hidden;
    flex: 1;

    max-width: 100%;
    min-height: 0;
  `,
  layer: css`
    position: absolute;
    inset: 0;

    overflow: hidden;
    display: flex;
    flex-direction: column;

    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
  `,
  panel: css`
    user-select: none;
    height: 100%;
    color: ${cssVar.colorTextSecondary};
    background: #f2f0ec;

    .dark & {
      border-inline-end: 1px solid #404040;
      background: #171717;
    }

    * {
      user-select: none;
    }

    #${USER_DROPDOWN_ICON_ID} {
      width: 0 !important;
      opacity: 0;
      transition:
        opacity,
        width 0.2s ${cssVar.motionEaseOut};
    }
    #${BACK_BUTTON_ID} {
      width: 24px !important;
    }

    &:hover {
      #${USER_DROPDOWN_ICON_ID} {
        width: 14px !important;
        opacity: 1;
      }
    }
  `,
}));

interface NavPanelDraggableProps {
  activeContent: {
    key: string;
    node: ReactNode;
  };
}

const classNames = {
  content: draggableStyles.content,
};

export const NavPanelDraggable = memo<NavPanelDraggableProps>(({ activeContent }) => {
  const [expand, togglePanel] = useGlobalStore((s) => [
    systemStatusSelectors.showLeftPanel(s),
    s.toggleLeftPanel,
  ]);
  const animationMode = useUserStore(userGeneralSettingsSelectors.animationMode);
  const shouldUseMotion = !isMotionDisabled(animationMode);
  // const handleSizeChange = useNavPanelSizeChangeHandler();

  const defaultWidthRef = useRef(0);
  if (defaultWidthRef.current === 0) {
    defaultWidthRef.current = systemStatusSelectors.leftPanelWidth(useGlobalStore.getState());
  }

  const defaultSize = useMemo(
    () => ({
      height: '100%',
      width: defaultWidthRef.current,
    }),
    [],
  );
  const styles = useMemo(
    () => ({
      zIndex: 11,
    }),
    [],
  );

  const historyRef = useRef([activeContent.key]);
  const directionRef = useRef<MotionDirection>(0);

  const history = historyRef.current;
  const direction = shouldUseMotion ? getMotionDirectionByHistory(history, activeContent.key) : 0;
  if (direction !== 0) {
    directionRef.current = direction;
  }

  useLayoutEffect(() => {
    if (!shouldUseMotion) return;

    const snapshot = historyRef.current;
    const currentKey = snapshot.at(-1);
    const nextKey = activeContent.key;

    if (currentKey === nextKey) return;

    const existingIndex = snapshot.lastIndexOf(nextKey);
    if (existingIndex !== -1) {
      snapshot.splice(existingIndex + 1);
      return;
    }

    snapshot.push(nextKey);
  }, [activeContent.key, shouldUseMotion]);

  const motionDirection = shouldUseMotion ? directionRef.current : 0;
  const sidebarWidth = expand ? 255 : 56;

  return (
    <>
      <DraggablePanel
        className={draggableStyles.panel}
        classNames={classNames}
        defaultSize={defaultSize}
        expand={true}
        expandable={false}
        maxWidth={sidebarWidth}
        minWidth={sidebarWidth}
        mode="fixed"
        placement="left"
        showBorder={false}
        size={{ height: '100%', width: sidebarWidth }}
        style={{ ...styles, overflow: 'visible' }}
        onExpandChange={togglePanel}
      >
        <div className={draggableStyles.inner}>
          {shouldUseMotion ? (
            <AnimatePresence custom={motionDirection} initial={false} mode="sync">
              <motion.div
                animate="animate"
                className={draggableStyles.layer}
                custom={motionDirection}
                exit="exit"
                initial="initial"
                key={activeContent.key}
                transition={motionVariants.transition}
                variants={motionVariants}
              >
                <ExitingFrozenContent>{activeContent.node}</ExitingFrozenContent>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className={draggableStyles.layer} key={activeContent.key}>
              {activeContent.node}
            </div>
          )}
        </div>
        <Suspense>
          <Footer />
        </Suspense>
      </DraggablePanel>
    </>
  );
});
