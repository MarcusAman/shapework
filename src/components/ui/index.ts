/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Shapework Shared UI Primitive Foundation — Phase B1, B2 & B3
 */

// B1 Primitives
export { default as Button, type ButtonProps } from './Button';
export { default as ActionButton } from './ActionButton';
export { default as IconButton, type IconButtonProps } from './IconButton';
export { default as SurfaceCard, Card, type SurfaceCardProps } from './SurfaceCard';
export { default as Badge, type BadgeProps } from './Badge';
export { default as StatusBadge, type StatusBadgeProps } from './StatusBadge';
export { default as TextInput, type TextInputProps } from './TextInput';
export { default as TextArea, type TextAreaProps } from './TextArea';
export { default as SearchInput, type SearchInputProps } from './SearchInput';
export { default as Select, type SelectProps, type SelectOption } from './Select';
export { default as Checkbox, type CheckboxProps } from './Checkbox';
export { default as Tabs, type TabsProps, type TabItem } from './Tabs';
export { default as SegmentedControl, type SegmentedControlProps, type SegmentOption } from './SegmentedControl';
export { default as Avatar, type AvatarProps } from './Avatar';
export { default as EmptyState, type EmptyStateProps } from './EmptyState';

// B2 Overlay & Form Primitives
export { default as Modal, Dialog, type ModalProps } from './Modal';
export { default as ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
export { default as Drawer, Sheet, type DrawerProps } from './Drawer';
export { default as Popover, type PopoverProps } from './Popover';
export { default as DropdownMenu, type DropdownMenuItem, type DropdownMenuProps } from './DropdownMenu';
export {
  FormField,
  FormGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
  useFormField,
  type FormFieldProps,
  type FormGroupProps,
  type FieldLabelProps,
  type FieldDescriptionProps,
  type FieldErrorProps
} from './FormField';

// B3 Data Presentation & Operational Primitives
export { MetricTile, MetricGroup, type MetricTileProps, type MetricGroupProps } from './MetricTile';
export { DataTable, type DataTableColumn, type DataTableProps } from './DataTable';
export { ResponsiveDataList, type ResponsiveDataItem, type ResponsiveDataListProps } from './ResponsiveDataList';
export { DataToolbar, type DataToolbarProps } from './DataToolbar';
export { Pagination, type PaginationProps } from './Pagination';
export { ProgressBar, type ProgressBarProps } from './ProgressBar';
export { Skeleton, LoadingState, type SkeletonProps, type LoadingStateProps } from './Skeleton';

// C4 Toast Notification Primitive
export { ToastProvider, useToast, type ToastType, type ToastOptions, type ToastItem } from './ToastContext';
export { ToastContainer } from './ToastContainer';

