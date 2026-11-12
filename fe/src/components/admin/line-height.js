import { Extension } from "@tiptap/core";

/**
 * Giãn dòng cho đoạn văn / tiêu đề (giống "Line spacing" trong Word):
 * lưu thành style="line-height: 1.5" trên thẻ <p>/<h2>/<h3> → trang bài viết công khai hiện đúng như vậy.
 * Không chọn = dùng khoảng cách mặc định của website.
 */
export const LineHeight = Extension.create({
  name: "lineHeight",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el) => el.style.lineHeight || null,
            renderHTML: (attrs) =>
              attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight) =>
        ({ commands }) =>
          this.options.types
            .map((type) => commands.updateAttributes(type, { lineHeight }))
            .some(Boolean),
      unsetLineHeight:
        () =>
        ({ commands }) =>
          this.options.types
            .map((type) => commands.resetAttributes(type, "lineHeight"))
            .some(Boolean),
    };
  },
});
