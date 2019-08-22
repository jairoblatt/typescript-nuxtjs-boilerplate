import { mount, shallowMount } from '@vue/test-utils'
import HelloWorld from '@/components/partials/Example/HelloWorld.vue'

describe('HelloWorld', (): void => {
  test('is a Vue instance', (): void => {
    const wrapper = mount(HelloWorld)
    expect(wrapper.isVueInstance()).toBeTruthy()
  })

  test('renders props.message when passed', (): void => {
    const message = 'new message'
    const wrapper = shallowMount(HelloWorld, {
      propsData: { message }
    })
    expect(wrapper.text()).toMatch(message)
  })
})
