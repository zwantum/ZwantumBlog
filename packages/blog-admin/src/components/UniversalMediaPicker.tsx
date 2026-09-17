import React from 'react';
import { MediaLibrary, MediaLibraryProps } from '../views/MediaLibrary';

export type UniversalMediaPickerProps = MediaLibraryProps;
export const UniversalMediaPicker: React.FC<UniversalMediaPickerProps> = (props) => {
  return <MediaLibrary {...props} />;
};
export default UniversalMediaPicker;
