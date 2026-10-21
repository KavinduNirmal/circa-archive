import * as React from "react";
import { Avatar as Primitive } from "radix-ui";
// The existing shadcn/Radix contract, styled by this publication's CSS.
function Avatar(props: React.ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root {...props} data-slot="avatar" />;
}
function AvatarImage(props: React.ComponentProps<typeof Primitive.Image>) {
  return <Primitive.Image {...props} data-slot="avatar-image" />;
}
function AvatarFallback(
  props: React.ComponentProps<typeof Primitive.Fallback>,
) {
  return <Primitive.Fallback {...props} data-slot="avatar-fallback" />;
}
function AvatarGroup(props: React.ComponentProps<"div">) {
  return <div {...props} data-slot="avatar-group" />;
}
interface Props {
  members: readonly {
    name: string;
    initials: string;
    portrait: string;
    profile: string;
  }[];
  label: string;
}
export default function TeamAvatars({ members, label }: Props) {
  return (
    <AvatarGroup role="group" aria-label={label}>
      {members.map((member) => (
        <a
          key={member.profile}
          href={member.profile}
          aria-label={member.name}
          target="_blank"
          rel="noreferrer"
        >
          <Avatar>
            <AvatarImage src={member.portrait} alt={member.name} />
            <AvatarFallback>{member.initials}</AvatarFallback>
          </Avatar>
        </a>
      ))}
      <Avatar aria-hidden="true">
        <AvatarFallback>+</AvatarFallback>
      </Avatar>
    </AvatarGroup>
  );
}
