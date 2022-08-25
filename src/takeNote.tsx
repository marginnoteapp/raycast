import {
  Action,
  ActionPanel,
  closeMainWindow,
  Form,
  getPreferenceValues,
  Keyboard,
  popToRoot,
  showHUD
} from "@raycast/api"
import { useState } from "react"
import { Preferences } from "./typings"
import { creatNote, dateFormat, unique } from "./utils"

interface FormType {
  title: string
  excerptText: string
  commentText: string
  customTags: string
  selectTags: string[]
  link: string
}

const preferences = getPreferenceValues<Preferences>()
const parentNotes = [
  preferences.parentNote1,
  preferences.parentNote2,
  preferences.parentNote3,
  preferences.parentNote4,
  preferences.parentNote5
].reduce(
  (acc, k, i) => {
    if (!k) return acc
    k = k.trim()
    const title = k.match(/^(.+)=marginnote/)
    const id = k.match(/note\/(.+)$/)
    if (!id) return acc
    acc.push({
      title: "Creat to " + (title ? title[1] : "Parent Note " + (i + 1)),
      id: id[1]
    })
    return acc
  },
  [] as {
    title: string
    id: string
  }[]
)

export default function (props: { draftValues?: FormType }) {
  const { draftValues } = props
  const [excerptTextError, setExcerptTextError] = useState<string | undefined>()
  function dropExcerptError() {
    if (excerptTextError && excerptTextError.length > 0) {
      setExcerptTextError(undefined)
    }
  }
  return (
    <Form
      enableDrafts
      actions={
        <ActionPanel>
          {parentNotes.map((k, index) => (
            <Action.SubmitForm
              title={k.title}
              key={index}
              shortcut={{
                modifiers: ["cmd"],
                key: `${index + 1}` as Keyboard.KeyEquivalent
              }}
              onSubmit={async (v: FormType) => {
                if (v.excerptText) {
                  dropExcerptError()
                  await creatNote(
                    {
                      title: v.title,
                      excerptText: v.excerptText,
                      commentText: v.commentText,
                      tags: unique([
                        ...v.customTags
                          .split(/\s+/)
                          .map(k => (!k || k.startsWith("#") ? k : "#" + k)),
                        ...v.selectTags.map(k => `#${k}`)
                      ]).join(" "),
                      link: v.link
                    },
                    k.id
                  )
                  showHUD("Note-taking success")
                  popToRoot()
                  closeMainWindow()
                } else {
                  setExcerptTextError("The field should't be empty!")
                }
              }}
            />
          ))}
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        placeholder={`Use ; to add multiple titles`}
        title="Title"
        defaultValue={draftValues?.title}
      />
      <Form.TextArea
        id="excerptText"
        title="Excerpt Text"
        autoFocus={true}
        placeholder="Some text you want to excerpt"
        error={excerptTextError}
        onChange={dropExcerptError}
        defaultValue={draftValues?.excerptText}
      />
      <Form.TextArea
        id="commentText"
        title="Comment Text"
        placeholder="Some text about your feelings or thoughts"
        defaultValue={draftValues?.commentText}
      />
      <Form.TextField
        id="link"
        placeholder={"Link or another comment"}
        title="Link"
        defaultValue={draftValues?.link}
      />
      <Form.TextField
        id="customTags"
        title="Custom Tags"
        placeholder="Just like #tag1 #tag2"
        defaultValue={draftValues?.customTags}
      />
      <Form.TagPicker
        id="selectTags"
        title="Select Tags"
        defaultValue={draftValues?.selectTags}
      >
        <Form.TagPicker.Item
          value={dateFormat(new Date(), "YYYYmmdd")}
          title={dateFormat(new Date(), "YYYYmmdd")}
          icon="📅"
        />
      </Form.TagPicker>
    </Form>
  )
}