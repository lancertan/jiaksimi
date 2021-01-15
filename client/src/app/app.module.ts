import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/login.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginService } from './login.service';
import { HttpClientModule } from '@angular/common/http';
import { ReviewComponent } from './components/review.component';
import { CameraService } from './camera.service';
import { CaptureComponent } from './components/capture.component';
import { WebcamModule } from 'ngx-webcam';
import { AgmCoreModule } from '@agm/core';
import { LocateComponent } from './components/locate.component';
import { LocationService } from './location.service';
import { AppService } from './app.service';
import { ListComponent } from './components/list.component';
import { MenuComponent } from './components/menu.component';
import { FeedbackComponent } from './components/feedback.component';

const ROUTES: Routes = [
 // { path: '', component: LoginComponent },
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent,
    canActivate: [LoginService]},
  { path: 'review', component: ReviewComponent,
    canActivate: [LoginService] },
  { path: 'capture', component: CaptureComponent,
    canActivate: [LoginService]},
  { path: 'locate', component: LocateComponent,
    canActivate: [LoginService]},
  { path: 'list', component: ListComponent },
  { path: 'feedback', component: FeedbackComponent,
    canActivate: [LoginService] },
  { path: '**', redirectTo: '/', pathMatch: 'full'}
]

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ReviewComponent,
    CaptureComponent,
    LocateComponent,
    ListComponent,
    MenuComponent,
    FeedbackComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(ROUTES),
    FormsModule, ReactiveFormsModule,
    HttpClientModule,
    WebcamModule, 
    AgmCoreModule.forRoot({
      apiKey: '',
      libraries: ['places', 'geometry']
    })
  ],
  providers: [LoginService, CameraService, LocationService, AppService],
  bootstrap: [AppComponent]
})
export class AppModule { }
