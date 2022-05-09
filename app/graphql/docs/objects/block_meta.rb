# frozen_string_literal: true
module Docs
  module Objects
    class BlockMeta < BrickGraphQL::BaseObject
      field :icon, BlockIcon, 'icon', null: true
      field :cover, BlockCover, 'cover', null: true
      field :embedMeta, BlockEmbedMeta, 'embedMeta', null: true
      field :image, BlockImage, 'image', null: true
      field :attachment, BlockAttachment, 'attachment', null: true
      field :link, BlockLink, 'link', null: true
      field :title, String, 'title', null: true
      field :people, BlockPeople, 'people', null: true
      field :page, BlockPage, 'page', null: true
      field :autoWrap, Boolean, 'code auto wrap', null: true
      ## NOTE: Prosemirror builtin
      field :level, Int, 'Prosemirror builtin level', null: true
      field :language, String, 'Prosemirror builtin language', null: true
      field :start, String, 'Prosemirror builtin start', null: true
    end
  end
end
