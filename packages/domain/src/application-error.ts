export abstract class PublicApplicationError<
  TCode extends string = string
> extends Error {
  protected constructor(
    public readonly code: TCode,
    message: string
  ) {
    super(message);
  }
}
