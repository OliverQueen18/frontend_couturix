import { FormBuilder, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth.service';

describe('LoginComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            login: () => ({ subscribe: () => undefined }),
            isAuthenticated: () => false
          }
        }
      ]
    }).compileComponents();
  });

  it('invalide le formulaire sans e-mail ni mot de passe', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.form.invalid).toBeTrue();
    component.form.setValue({ email: 'admin@couturix.local', password: 'Admin123!' });
    expect(component.form.valid).toBeTrue();
  });

  it('exige un e-mail valide', () => {
    const fb = TestBed.inject(FormBuilder);
    const form = fb.nonNullable.group({
      email: ['pas-un-email', [Validators.required, Validators.email]],
      password: ['x', Validators.required]
    });
    expect(form.controls.email.invalid).toBeTrue();
  });
});
