import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ShapeComponent from "./ShapeComponent";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    shape: {
      setShape: (options: {
        form?: string;
        width?: string;
        height?: string;
        rotation?: string;
        color?: string;
      }) => ReturnType;
    };
  }
}

export const Shape = Node.create({
  name: "shape",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      form: {
        default: "rectangle",
      },
      width: {
        default: "100px",
      },
      height: {
        default: "100px",
      },
      rotation: {
        default: "0deg",
      },
      color: {
        default: "#000000",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='shape']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-type": "shape" }, HTMLAttributes),
    ];
  },

  addCommands() {
    return {
      setShape:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ShapeComponent);
  },
});
