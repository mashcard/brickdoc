import { SlashMenuItem } from '../../components'
import * as EditorIcon from '../../components/Icon'
import { getRecentItemKey } from './recentItemsManager'

const FORMULA = {
  key: 'formula',
  alias: ['for'],
  icon: <EditorIcon.Formula />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).setFormulaBlock().run()
  }
}
const SPREADSHEET = {
  key: 'spreadsheet',
  alias: ['table'],
  icon: <EditorIcon.Table />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).setTableBlock().run()
  }
}
const UPLOAD = {
  key: 'upload',
  alias: ['up', 'file', 'pdf', 'excel', 'ppt', 'image', 'img'],
  icon: <EditorIcon.Upload />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor
      .chain()
      .deleteRange(range)
      .setEmbedBlock(range.from - 1)
      .run()
  }
}
const WEB_BOOKMARK = {
  key: 'webBookmark',
  alias: ['link'],
  icon: <EditorIcon.Code />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor
      .chain()
      .deleteRange(range)
      .setEmbedBlock(range.from - 1)
      .run()
  }
}
const HEADING_1 = {
  key: 'h1',
  alias: ['h1', 'heading 1'],
  icon: <EditorIcon.RteH1 />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
  }
}
const HEADING_2 = {
  key: 'h2',
  alias: ['h2', 'heading 2'],
  icon: <EditorIcon.RteH2 />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
  }
}
const HEADING_3 = {
  key: 'h3',
  alias: ['h3', 'heading 3'],
  icon: <EditorIcon.RteH3 />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
  }
}
const HEADING_4 = {
  key: 'h4',
  alias: ['h4', 'heading 4'],
  icon: <EditorIcon.RteH4 />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).setNode('heading', { level: 4 }).run()
  }
}
const HEADING_5 = {
  key: 'h5',
  alias: ['h5', 'heading 5'],
  icon: <EditorIcon.RteH5 />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).setNode('heading', { level: 5 }).run()
  }
}
const BULLETED_LIST = {
  key: 'bulletedList',
  alias: ['bul'],
  icon: <EditorIcon.ListUnordered />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).wrapInBrickList('bulletList').run()
  }
}
const ORDERED_LIST = {
  key: 'orderedList',
  alias: ['num', 'numberedList'],
  icon: <EditorIcon.ListOrdered />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).wrapInBrickList('orderedList').run()
  }
}
const CODE = {
  key: 'code',
  alias: ['co'],
  icon: <EditorIcon.Code />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).setCodeBlock().run()
  }
}
const DIVIDER = {
  key: 'divider',
  alias: ['div', 'hr'],
  icon: <EditorIcon.Divider />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).setHorizontalRule().run()
  }
}
const TOC = {
  key: 'toc',
  alias: ['toc', 'table of content'],
  icon: <EditorIcon.Toc />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).setTocBlock().run()
  }
}
const SUB_PAGE_MENU = {
  key: 'subPageMenu',
  alias: ['sub'],
  icon: <EditorIcon.MindmapList />,
  command: ({ editor, range }: Parameters<SlashMenuItem['command']>[0]) => {
    editor.chain().focus().deleteRange(range).setSubPageMenuBlock().run()
  }
}

export const slashMenuGroup = [
  {
    key: 'data',
    items: [FORMULA, SPREADSHEET]
  },
  {
    key: 'embed',
    items: [UPLOAD, WEB_BOOKMARK]
  },
  {
    key: 'text',
    items: [HEADING_1, HEADING_2, HEADING_3, HEADING_4, HEADING_5, BULLETED_LIST, ORDERED_LIST, CODE]
  },
  {
    key: 'others',
    items: [DIVIDER, TOC, SUB_PAGE_MENU]
  }
]

const slashMenuItems = [
  FORMULA,
  SPREADSHEET,
  UPLOAD,
  WEB_BOOKMARK,
  HEADING_1,
  HEADING_2,
  HEADING_3,
  HEADING_4,
  HEADING_5,
  BULLETED_LIST,
  ORDERED_LIST,
  CODE,
  DIVIDER,
  TOC,
  SUB_PAGE_MENU
]

export const TYPE_ITEMS: SlashMenuItem[] = [
  FORMULA,
  UPLOAD,
  WEB_BOOKMARK,
  TOC,
  SUB_PAGE_MENU,
  HEADING_1,
  HEADING_2,
  HEADING_3,
  HEADING_4,
  HEADING_5,
  ORDERED_LIST,
  BULLETED_LIST,
  CODE,
  DIVIDER
]

const RECENT_COUNT = 6

export const getRecentItems = (): SlashMenuItem[] => {
  return getRecentItemKey()
    .map(key => slashMenuItems.find(i => i.key === key))
    .filter(i => !!i)
    .slice(0, RECENT_COUNT) as SlashMenuItem[]
}

const SUGGESTION_COUNT = 5

export const getSuggestionItems = (query: string): SlashMenuItem[] => {
  if (!query) return []
  return slashMenuItems
    .filter(item => [item.key, ...(item.alias ?? [])].some(name => name.toLowerCase().startsWith(query.toLowerCase())))
    .slice(0, SUGGESTION_COUNT)
}
