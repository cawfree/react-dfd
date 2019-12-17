export const getLayoutKey = (parentId, layoutId) => (
  `${parentId ? `${parentId}` : ''}${layoutId ? `${parentId ? '.' : ''}${layoutId}` : ''}`
);

export const indexOf = (nodes, layoutId, prop) => nodes
  .reduce(
    (r, [nodeKey, { layoutKey: compareLayoutKey }], i) => (
      compareLayoutKey === getLayoutKey(layoutId, prop) ? i : r
    ),
    null,
  );
