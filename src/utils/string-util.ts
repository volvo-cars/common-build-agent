const replacer = /\{(.*?)\}/gm

export const encodeReplace = (input: string): string => {
  return input.replace(replacer, (full, encode) => {
    return encodeURIComponent(encode)
  })
}

export const commonStart = (s1: string, s2: string): string => {
  if (s1 && s2) {
    const shortestLength = Math.min(s1.length, s2.length)
    for (let i = 0; i < shortestLength; i++) {
      if (s1[i] !== s2[i]) {
        return s1.substring(0, i)
      }
    }
    return s1
  } else {
    return ""
  }
}

export namespace StringUtils {
  export const throwError = (error: string): string => {
    throw new Error(error)
  }
}
