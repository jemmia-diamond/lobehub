import { memo } from 'react';

/**
 * BottomMenu items (Community, Resources) are now rendered by Body
 * based on sidebarSectionOrder for drag-and-drop reordering support.
 * This component is kept as a placeholder for potential future use.
 */
const BottomMenu = memo(() => {
  const tab = useActiveTabKey();
  const navigate = useNavigate();
  const { bottomMenuItems: items } = useNavLayout();

  return (
    <Flexbox
      gap={1}
      paddingBlock={4}
      style={{
        overflow: 'hidden',
      }}
    >
      {items.map((item) => {
        if (item.hidden) return null;
        return (
          <Link
            key={item.key}
            to={item.url!}
            onClick={(e) => {
              if (isModifierClick(e)) return;
              e.preventDefault();
              navigate(item.url!);
            }}
          >
            <NavItem
              active={tab === item.key}
              icon={item.icon}
              paddingInline={8}
              title={item.title}
            />
          </Link>
        );
      })}
    </Flexbox>
  );
});

export default BottomMenu;
