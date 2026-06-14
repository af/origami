<img src="./origami.svg" width="150" />

UI components in pure CSS

## Setup

1. Install the package
2. Add to your tsconfig.json:

```json
  {
    ...
    "compilerOptions": {
      "types": ["origami"]
    }
  }
```
3. Include the main css file, eg `import 'origami/src/all.css'` (assuming Vite)
4. In your main css entrypoint:
* add css layer declarations, eg:
```
/* `app` can be replaced with whichever higher-precedence layers you'd like */
@layer ori-reset, ori-base, ori-components, ori-override, app;` 
```
* add your theme variables in a `:root { }` block. See the theme file examples in this repo
