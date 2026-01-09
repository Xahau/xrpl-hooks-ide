import { forwardRef } from 'react'
import { mauve, mauveDark, purple, purpleDark } from '@radix-ui/colors'
import { useTheme } from 'next-themes'
import { styled } from '../stitches.config'
import dynamic from 'next/dynamic'
import type { Props, StylesConfig } from 'react-select'
const SelectInput = dynamic(() => import('react-select'), { ssr: false })
const CreatableSelectInput = dynamic(() => import('react-select/creatable'), { ssr: false })

const getColors = (isDark: boolean) => {
  const colors: any = {
    // primary: pink.pink9,
    active: isDark ? purpleDark.purple9 : purple.purple9,
    activeLight: isDark ? purpleDark.purple5 : purple.purple5,
    primary: isDark ? mauveDark.mauve4 : mauve.mauve4,
    secondary: isDark ? mauveDark.mauve8 : mauve.mauve8,
    background: isDark ? mauveDark.mauve4 : mauve.mauve4,
    searchText: isDark ? mauveDark.mauve12 : mauve.mauve12,
    bg: isDark ? mauveDark.mauve1 : mauve.mauve1,
    dropDownBg: isDark ? mauveDark.mauve5 : mauve.mauve2,
    mauve4: isDark ? mauveDark.mauve4 : mauve.mauve4,
    mauve5: isDark ? mauveDark.mauve5 : mauve.mauve5,
    mauve8: isDark ? mauveDark.mauve8 : mauve.mauve8,
    mauve9: isDark ? mauveDark.mauve9 : mauve.mauve9,
    mauve12: isDark ? mauveDark.mauve12 : mauve.mauve12,
    border: isDark ? mauveDark.mauve10 : mauve.mauve10,
    placeholder: isDark ? mauveDark.mauve11 : mauve.mauve11
  }
  colors.outline = colors.background
  colors.selected = colors.secondary
  return colors
}

const getStyles = (isDark: boolean) => {
  const colors = getColors(isDark)
  const styles = {
    container: (provided: any) => {
      return {
        ...provided,
        position: 'relative' as const,
        width: '100%'
      }
    },
    singleValue: (provided: any) => ({
      ...provided,
      color: colors.mauve12
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: colors.dropDownBg
    }),
    control: (provided: any, state: any) => {
      return {
        ...provided,
        minHeight: 0,
        border: '0px',
        backgroundColor: colors.mauve4,
        boxShadow: `0 0 0 1px ${state.isFocused ? colors.border : colors.secondary}`
      }
    },
    input: (provided: any) => {
      return {
        ...provided,
        color: '$text'
      }
    },
    multiValue: (provided: any) => {
      return {
        ...provided,
        backgroundColor: colors.mauve8
      }
    },
    multiValueLabel: (provided: any) => {
      return {
        ...provided,
        color: colors.mauve12
      }
    },
    multiValueRemove: (provided: any) => {
      return {
        ...provided,
        ':hover': {
          background: colors.mauve9
        }
      }
    },
    option: (provided: any, state: any) => {
      return {
        ...provided,
        color: colors.searchText,
        backgroundColor: state.isFocused ? colors.activeLight : colors.dropDownBg,
        ':hover': {
          backgroundColor: colors.active,
          color: '#ffffff'
        },
        ':selected': {
          backgroundColor: 'red'
        }
      }
    },
    indicatorSeparator: (provided: any) => {
      return {
        ...provided,
        backgroundColor: colors.secondary
      }
    },
    dropdownIndicator: (provided: any, state: any) => {
      return {
        ...provided,
        padding: 6,
        color: state.isFocused ? colors.border : colors.secondary,
        ':hover': {
          color: colors.border
        }
      }
    },
    clearIndicator: (provided: any) => {
      return {
        ...provided,
        padding: 6,
        color: colors.secondary,
        ':hover': {
          color: colors.border
        }
      }
    }
  } as StylesConfig
  return styles
}

// eslint-disable-next-line react/display-name
const Select = forwardRef<any, Props>((props, ref) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const styles = getStyles(isDark)
  return (
    <SelectInput
      ref={ref}
      menuPosition={props.menuPosition || 'fixed'}
      styles={styles}
      {...props}
    />
  )
})

// eslint-disable-next-line react/display-name
const Creatable = forwardRef<any, Props>((props, ref) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const styles = getStyles(isDark)
  return (
    <CreatableSelectInput
      ref={ref}
      formatCreateLabel={label => `Enter "${label}"`}
      menuPosition={props.menuPosition || 'fixed'}
      styles={styles}
      {...props}
    />
  )
})

export default styled(Select, {})
export const CreatableSelect = styled(Creatable, {})
