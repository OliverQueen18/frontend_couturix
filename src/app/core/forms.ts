import { AbstractControl } from '@angular/forms';
import { NotifyService } from './notify.service';

export function requireValid(
  form: AbstractControl,
  notify: NotifyService,
  message = 'Complétez les champs obligatoires'
): boolean {
  if (form.valid) {
    return true;
  }
  form.markAllAsTouched();
  notify.error(message);
  return false;
}
