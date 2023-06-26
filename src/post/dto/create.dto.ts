export type CreatePostRequestDto = {
  title: string;
  content: string;
  type: string;
  isAnonymous: boolean;

  authorId: string;
  spaceId: string;
};
