export const emptyPortListener = name => data =>
  console.warn(`A port that you didn't make a lister for, "${name}", sent data to JavaScript:`, data)

export const tagFunction = args => ({
  tag: args[0],
  rest: args.slice(1)
})
