declare module '*.less' {
  const resource: { [key: string]: string }
  export = resource
}

declare module '*.css' {
  const resource: { [key: string]: string }
  export = resource
}

declare module '*.png' {
  const content: string

  export = content
}

declare module '*.mp4' {
  const src: string
  export = src
}