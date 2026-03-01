import React from "react";

const FILTERED_PROPS = new Set([
  "animate",
  "initial",
  "exit",
  "variants",
  "transition",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileInView",
  "viewport",
  "layout",
  "layoutId",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "onAnimationComplete",
  "onUpdate",
  "transformTemplate",
]);

function cleanProps(props = {}) {
  const next = {};
  Object.keys(props).forEach((key) => {
    if (!FILTERED_PROPS.has(key)) next[key] = props[key];
  });
  return next;
}

function createMotionComponent(tag) {
  return React.forwardRef((props, ref) =>
    React.createElement(tag, { ...cleanProps(props), ref }, props?.children)
  );
}

export const motion = new Proxy(
  {},
  {
    get(_target, tag) {
      return createMotionComponent(tag);
    },
  }
);

export function AnimatePresence({ children }) {
  return React.createElement(React.Fragment, null, children);
}

export default motion;
