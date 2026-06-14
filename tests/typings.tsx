// Simple script intended only to verify the jsx typings work as expected
// This is just meant to be used for tsc, not to be run

const expectedUsage = (
  <div>
    <hstack-i>hi</hstack-i>

    <vstack-i gap="s" pad="m" vpad="none">
      hello
      <skeleton-i radius="full" />
    </vstack-i>

    <card-i pad="s">
      <h1>Hello</h1>
      <switch-i>
        <label>
          <input type="checkbox" /> Checkbox
        </label>
      </switch-i>

      <tooltip-i>
        {/* @ts-expect-error no interestFor in types yet */}
        <button type="button" interestFor="tooltip">
          hi
        </button>
        <div popover="auto" id="tooltip">
          cool
        </div>
      </tooltip-i>

      <toggletip-i>
        <button type="button" popoverTarget="tip-x">
          toggle me
        </button>
        <div role="status" id="tip-x" popover="hint">
          This is the toggletip content
        </div>
      </toggletip-i>
    </card-i>
  </div>
)

// @ts-expect-error This is not a real element
const _invalid1 = <jstack-i>nonsense</jstack-i>

// @ts-expect-error This is not a supported property
const _invalidProperty = <hstack-i asdf>nonsense</hstack-i>

console.log(expectedUsage)
