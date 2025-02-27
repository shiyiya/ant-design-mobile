import * as React from 'react'
import { render, testA11y, fireEvent, waitFor, cleanup } from 'testing'
import ActionSheet, { Action } from '../'
import Button from '../../button'
import type { ActionSheetProps, ActionSheetShowHandler } from '..'

const classPrefix = `adm-action-sheet`

const actions: Action[] = [
  { text: '复制', key: 'copy' },
  { text: '修改', key: 'edit' },
  { text: '删除', key: 'delete' },
]

function App(props: Partial<ActionSheetProps>) {
  const [visible, setVisible] = React.useState(false)
  const defaultProps = {
    visible,
    actions,
    onClose: () => setVisible(false),
  }
  return (
    <>
      <Button onClick={() => setVisible(true)}>button</Button>
      <ActionSheet {...defaultProps} {...props} />
    </>
  )
}

afterEach(cleanup)

describe('ActionSheet', () => {
  test('a11y', async () => {
    await testA11y(<ActionSheet visible={true} actions={actions} />)
  })

  test('basic usage', async () => {
    const { getByText, baseElement } = await render(
      <App extra='请选择你要进行的操作' cancelText='取消' />
    )
    fireEvent.click(getByText('button'))

    await waitFor(() => {
      expect(baseElement.querySelectorAll(`.${classPrefix}`)[0]).toBeVisible()
    })

    expect(baseElement).toMatchSnapshot()
  })

  test('renders Imperative', async () => {
    const onClose = jest.fn()
    function Imperative() {
      const handler = React.useRef<ActionSheetShowHandler>()
      const actions: Action[] = [
        {
          text: '复制',
          key: 'copy',
        },
        {
          text: '修改',
          key: 'edit',
          onClick: () => {
            handler.current?.close()
          },
        },
      ]
      return (
        <>
          <Button
            onClick={() => {
              handler.current = ActionSheet.show({
                actions,
                onClose,
              })
            }}
          >
            显示
          </Button>
        </>
      )
    }
    const { getByText, baseElement } = await render(<Imperative />)
    fireEvent.click(getByText('显示'))
    await waitFor(() => {
      expect(baseElement.querySelectorAll(`.${classPrefix}`)[0]).toBeVisible()
    })

    fireEvent.click(getByText('修改'))

    await waitFor(() => {
      expect(onClose).toBeCalled()
      expect(baseElement.querySelectorAll(`.${classPrefix}`).length).toBe(0)
    })
  })

  test('rendered to the current node', async () => {
    const { getByText, container } = await render(<App getContainer={null} />)
    fireEvent.click(getByText('button'))

    await waitFor(() => {
      expect(container.querySelectorAll(`.${classPrefix}`)[0]).toBeTruthy()
    })
  })

  test('action status', async () => {
    const actions: Action[] = [
      { text: '复制', key: 'copy' },
      { text: '修改', key: 'edit', disabled: true },
      {
        text: '删除',
        key: 'delete',
        description: '删除后数据不可恢复',
        danger: true,
      },
    ]

    const { getByText } = await render(<App actions={actions} visible />)

    expect(getByText('修改').parentElement).toBeDisabled()
    expect(getByText('删除').parentElement).toHaveClass(
      `${classPrefix}-button-item-danger`
    )
  })

  test('onAction shound be called', async () => {
    const onAction = jest.fn()

    const { getByText } = await render(<App onAction={onAction} visible />)

    fireEvent.click(getByText('复制'))
    expect(onAction).toBeCalled()
  })

  test('should close after clicking the option', async () => {
    const onClose = jest.fn()
    const { getByText, baseElement } = await render(<App closeOnAction />)

    fireEvent.click(getByText('button'))
    await waitFor(() => {
      fireEvent.click(getByText('复制'))
    })

    fireEvent.click(getByText('复制'))
    await waitFor(() => {
      expect(
        baseElement.querySelectorAll(`.${classPrefix}`)[0]
      ).not.toBeVisible()
    })
  })

  test('should not close after clicking the mask layer', async () => {
    const { getByText, baseElement } = await render(
      <App actions={actions} closeOnMaskClick={false} />
    )
    fireEvent.click(getByText('button'))

    await waitFor(() =>
      fireEvent.click(baseElement.querySelectorAll(`.adm-mask-aria-button`)[0])
    )

    expect(baseElement.querySelectorAll(`.${classPrefix}`)[0]).toBeVisible()
  })

  test('action click shound be called', async () => {
    const onClick = jest.fn()
    const actions: Action[] = [
      {
        text: '删除',
        key: 'delete',
        onClick: onClick,
      },
    ]

    const { getByText } = await render(<App actions={actions} visible />)
    fireEvent.click(getByText('删除'))
    expect(onClick).toBeCalled()
  })

  test('onMaskClick should be called', async () => {
    const onMaskClick = jest.fn()
    await render(<App actions={actions} visible onMaskClick={onMaskClick} />)
    fireEvent.click(document.querySelectorAll(`.adm-mask-aria-button`)[0])

    expect(onMaskClick).toBeCalled()
  })
})
