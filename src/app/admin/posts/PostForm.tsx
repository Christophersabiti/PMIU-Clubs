import type { Post } from "@prisma/client";
import { savePost } from "@/app/actions/admin";
import { POST_TYPES } from "@/components/cards";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Checkbox, Field, Input, Select, Textarea, inputCls } from "@/components/ui";

export function PostForm({ post, clubs, allowChapterWide }: { post?: Post; clubs: { id: string; shortName: string }[]; allowChapterWide: boolean }) {
  return (
    <ActionForm action={savePost} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}
      <Card className="grid gap-4 sm:grid-cols-2">
        <Select label="Type" name="type" defaultValue={post?.type ?? "NEWS"} options={Object.entries(POST_TYPES).map(([value, label]) => ({ value, label }))} hint="Publishing an announcement notifies members by email and in-app" />
        <Select label="Club" name="clubId" defaultValue={post?.clubId ?? ""} options={clubs.map((c) => ({ value: c.id, label: c.shortName }))} placeholder={allowChapterWide ? "All clubs (chapter-wide)" : undefined} required={!allowChapterWide} />
        <div className="sm:col-span-2"><Input label="Title" name="title" defaultValue={post?.title} required /></div>
        <div className="sm:col-span-2"><Input label="Excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} maxLength={240} /></div>
        <div className="sm:col-span-2"><Textarea label="Body" name="body" defaultValue={post?.body} rows={12} required hint="Separate paragraphs with a new line." /></div>
        <Field label="Cover image" name="coverFile"><input id="coverFile" name="coverFile" type="file" accept="image/jpeg,image/png,image/webp" className={inputCls} /></Field>
        <Input label="YouTube video URL" name="youtubeUrl" type="url" defaultValue={post?.youtubeUrl ?? ""} hint="Videos are embedded from YouTube, not hosted." />
        <div className="sm:col-span-2"><Checkbox name="published" label="Published" defaultChecked={post?.published ?? true} /></div>
      </Card>
      <SubmitButton>{post ? "Save" : "Create"}</SubmitButton>
    </ActionForm>
  );
}
