import React from "react"
import { Story } from "@storybook/react"
import { Tag, TagProps } from "../../"
import { Twitter } from '../icon'
export default {
  title: "ReactComponents/Tag",
  component: Tag,
  parameters: {
    docs: {
      description: {
        component: `
Tag for categorizing or markup.

## When To Use

- It can be used to tag by dimension or property.

- When categorizing.

## API

### Tag

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| closable | Whether the Tag can be closed | boolean | false |
| closeIcon | Custom close icon | ReactNode | - |
| color | Color of the Tag | string | - |
| icon | Set the icon of tag | ReactNode | - |
| visible | Whether the Tag is closed or not | boolean | true |
| onClose | Callback executed when tag is closed | (e) => void | - |

### Tag.CheckableTag

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| checked | Checked status of Tag | boolean | false |
| onChange | Callback executed when Tag is checked/unchecked | (checked) => void | - |

`
      }
    }
  }
}

const { CheckableTag } = Tag


const Template: Story<TagProps> = (_args) =>
  <>
    <Tag>Tag 1</Tag>
    <Tag>
      <a href="https://github.com/ant-design/ant-design/issues/1862">Link</a>
    </Tag>
    <Tag closable >
      Tag 2
    </Tag>
    <CheckableTag>CheckableTag</CheckableTag>
    <CheckableTag checked>CheckableTag</CheckableTag>
    <Tag color="magenta">magenta</Tag>
    <Tag color="red">red</Tag>
    <Tag color="volcano">volcano</Tag>
    <Tag color="orange">orange</Tag>
    <Tag color="gold">gold</Tag>
    <Tag color="lime">lime</Tag>
    <Tag color="green">green</Tag>
    <Tag icon={<Twitter />} color="#55acee">
      Twitter
    </Tag>
  </>
export const Base = Template.bind({})

