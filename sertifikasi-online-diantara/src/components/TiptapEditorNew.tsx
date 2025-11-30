"use client";

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Blockquote from "@tiptap/extension-blockquote";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Table as TableIcon,
} from "lucide-react";
import "../css/table.css";
import "../css/image-ratio.css";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-background-color"),
        renderHTML: (attributes) => {
          return {
            "data-background-color": attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },
});

const MenuButton = ({
  onClick,
  isActive = false,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
      isActive ? "bg-gray-200 dark:bg-gray-600" : ""
    }`}
  >
    {children}
  </button>
);

const MenuBar = ({ editor }: { editor: any }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showTableMenu, setShowTableMenu] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);

  useEffect(() => {
    return () => {
      setBoldActive(false);
      setItalicActive(false);
      setUnderlineActive(false);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowTableMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggle = (cmd: () => void) => {
    if (!editor) return;
    cmd();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result;
      if (typeof base64 === "string") {
        editor
          .chain()
          .focus()
          .setImage({
            src: base64,
            alt: file.name,
          })
          .run();
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  if (!editor) return null;

  return (
    <div className="border-b border-gray-200 p-2 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.preventDefault();
              setBoldActive((prev) => !prev);
              toggle(() => editor.chain().focus().toggleBold().run());
            }}
            className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              boldActive ? "bg-gray-200 dark:bg-gray-600" : ""
            }`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setItalicActive((prev) => !prev);
              toggle(() => editor.chain().focus().toggleItalic().run());
            }}
            className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              italicActive ? "bg-gray-200 dark:bg-gray-600" : ""
            }`}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setUnderlineActive((prev) => !prev);
              toggle(() => editor.chain().focus().toggleUnderline().run());
            }}
            className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              underlineActive ? "bg-gray-200 dark:bg-gray-600" : ""
            }`}
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run(),
              );
            }}
            className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              editor.isActive("heading", { level: 1 })
                ? "bg-gray-200 dark:bg-gray-600"
                : ""
            }`}
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(() => editor.chain().focus().toggleBlockquote().run());
            }}
            className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              editor.isActive("blockquote")
                ? "bg-gray-200 dark:bg-gray-600"
                : ""
            }`}
          >
            <Quote className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(() => editor.chain().focus().toggleBulletList().run());
            }}
            className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              editor.isActive("bulletList")
                ? "bg-gray-200 dark:bg-gray-600"
                : ""
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(() => editor.chain().focus().toggleOrderedList().run());
            }}
            className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              editor.isActive("orderedList")
                ? "bg-gray-200 dark:bg-gray-600"
                : ""
            }`}
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(() => editor.chain().focus().setTextAlign("left").run());
            }}
            className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              editor.isActive({ textAlign: "left" })
                ? "bg-gray-200 dark:bg-gray-600"
                : ""
            }`}
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(() => editor.chain().focus().setTextAlign("center").run());
            }}
            className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              editor.isActive({ textAlign: "center" })
                ? "bg-gray-200 dark:bg-gray-600"
                : ""
            }`}
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(() => editor.chain().focus().setTextAlign("right").run());
            }}
            className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              editor.isActive({ textAlign: "right" })
                ? "bg-gray-200 dark:bg-gray-600"
                : ""
            }`}
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </button>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="relative flex" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowTableMenu(!showTableMenu)}
              className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                editor.isActive("table") ? "bg-gray-200 dark:bg-gray-600" : ""
              }`}
            >
              <TableIcon className="h-4 w-4" />
            </button>

            {showTableMenu && (
              <div className="absolute left-0 z-50 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
                <div className="py-1">
                  {!editor.isActive("table") ? (
                    <button
                      type="button"
                      onClick={() =>
                        editor
                          .chain()
                          .focus()
                          .insertTable({
                            rows: 3,
                            cols: 3,
                            withHeaderRow: true,
                          })
                          .run()
                      }
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-blue-100 dark:text-gray-200 dark:hover:bg-blue-900/30"
                      title="Insert Table"
                    >
                      Insert Table
                    </button>
                  ) : (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Columns
                      </div>
                      <button
                        onClick={() =>
                          editor.chain().focus().addColumnBefore().run()
                        }
                        disabled={!editor.can().addColumnBefore()}
                        className="table-btn w-full px-4 py-2 text-left text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title="Add column before"
                      >
                        Add column before
                      </button>
                      <button
                        onClick={() =>
                          editor.chain().focus().addColumnAfter().run()
                        }
                        disabled={!editor.can().addColumnAfter()}
                        className="table-btn w-full px-4 py-2 text-left text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title="Add column after"
                      >
                        Add column after
                      </button>
                      <button
                        onClick={() =>
                          editor.chain().focus().deleteColumn().run()
                        }
                        disabled={!editor.can().deleteColumn()}
                        className="table-btn w-full px-4 py-2 text-left text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title="Delete column"
                      >
                        Delete column
                      </button>

                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Rows
                      </div>
                      <button
                        onClick={() =>
                          editor.chain().focus().addRowBefore().run()
                        }
                        disabled={!editor.can().addRowBefore()}
                        className="table-btn w-full px-4 py-2 text-left text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title="Add row before"
                      >
                        Add row before
                      </button>
                      <button
                        onClick={() =>
                          editor.chain().focus().addRowAfter().run()
                        }
                        disabled={!editor.can().addRowAfter()}
                        className="table-btn w-full px-4 py-2 text-left text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title="Add row after"
                      >
                        Add row after
                      </button>
                      <button
                        onClick={() => editor.chain().focus().deleteRow().run()}
                        disabled={!editor.can().deleteRow()}
                        className="table-btn w-full px-4 py-2 text-left text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title="Delete row"
                      >
                        Delete row
                      </button>

                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Headers
                      </div>
                      <button
                        onClick={() =>
                          editor.chain().focus().toggleHeaderRow().run()
                        }
                        disabled={!editor.can().toggleHeaderRow()}
                        className="table-btn w-full px-4 py-2 text-left text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title="Toggle header row"
                      >
                        Toggle header row
                      </button>
                      <button
                        onClick={() =>
                          editor.chain().focus().toggleHeaderColumn().run()
                        }
                        disabled={!editor.can().toggleHeaderColumn()}
                        className="table-btn w-full px-4 py-2 text-left text-sm transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title="Toggle header column"
                      >
                        Toggle header column
                      </button>

                      <div className="border-t border-gray-200 dark:border-gray-600"></div>
                      <button
                        onClick={() =>
                          editor.chain().focus().deleteTable().run()
                        }
                        disabled={!editor.can().deleteTable()}
                        className="table-btn w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        title="Delete table"
                      >
                        Delete table
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        underline: false, // tambahkan ini
        blockquote: false, // tambahkan ini
      }),
      Underline, // custom
      // Blockquote, // jika ingin custom, aktifkan, jika tidak, hapus
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem,
      Image,
      TextAlign.configure({
        types: ["heading", "paragraph", "blockquote"],
        alignments: ["left", "center", "right"],
        defaultAlignment: "left",
      }),
      Blockquote,
      Table.configure({
        resizable: true,
        handleWidth: 4,
        cellMinWidth: 48,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
        HTMLAttributes: {
          class: "w-full border-collapse relative",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "relative",
        },
      }),
      CustomTableCell.configure({
        HTMLAttributes: {
          class:
            "border border-gray-200 p-2 align-middle relative dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
          style: "min-width: 48px; height: 10px",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class:
            "border border-gray-200 bg-gray-50 p-2 font-semibold text-left relative dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700",
          style: "min-width: 48px; height: 10px",
        },
      }),
    ],
    content: content || "<p></p>",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onCreate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg dark:prose-invert focus:outline-none max-w-none p-4 min-h-[200px] leading-none prose-p:mb-1 prose-p:mt-0",
      },
    },
    editable: true,
  });

  if (!isMounted) {
    return (
      <div className="min-h-[200px] rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-[#122031]">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-4">
            <div className="mb-2 h-4 w-3/4 bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-[#122031]">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
