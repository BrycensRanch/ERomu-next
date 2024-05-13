<p align="center"><img src="https://i.imgur.com/a9QWW0v.png"></p>

## Usage

## Roadmap

- Use open source LLM to convert speech to text

### Create an App

```
# with npx
$ npx create-nextron-app my-app --example with-tailwindcss

# with yarn
$ yarn create nextron-app my-app --example with-tailwindcss

# with pnpm
$ pnpm dlx create-nextron-app my-app --example with-tailwindcss
```

# note to add this back

```json
	"packageManager": "pnpm@8.15.4+sha1.c85a4305534f76d461407b59277b954bac97b5c4"
```

### Install Dependencies

ONLY USE PYTHON 3.11 WHEN INSTALLING DEPENDENCIES PYTHON 3.12 AT THE MOMENT IS BROKEN BY NATIVE DEPENDENCIES

```
$ cd my-app

# using yarn or npm
$ yarn (or `npm install`)

# using pnpm
$ pnpm install --shamefully-hoist
```

### Use it

```
# development mode
$ yarn dev (or `npm run dev` or `pnpm run dev`)

# production build
$ yarn build (or `npm run build` or `pnpm run build`)
```
