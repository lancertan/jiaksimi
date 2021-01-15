import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class AppService {    
    httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    }

    apiUrl = 'http://localhost:3000'

    constructor(private http: HttpClient) {}

    sendFeedback(payload){
        //console.info('AppSvc formdata.user: ', formData.get('user'))
        //console.info('AppSvc formdata.comment: ', formData.get('comments'))
        return this.http.post(`${this.apiUrl}/feedback`, payload)
    }

    uploadReview(formData: FormData){
        return this.http.post(`${this.apiUrl}/upload`, formData)
    }

    getReviews(lat, lng, rad): Observable<any>{
        console.log('get reviews')
        return this.http.get<string[]>(`${this.apiUrl}/reviews?lat=${lat}&lng=${lng}&rad=${rad}`)
            .pipe(
                tap(_=>console.log('fetched reviews')),
                    catchError(this.handleError<string[]>('getReviews', []))
            )
    }

    deleteReview(id){
        return this.http.delete(`${this.apiUrl}/deleteReview/${id}`)
    }

    getHawkers(): Observable<any>{
        console.log('get hawkers')
        return this.http.get<string[]>(`${this.apiUrl}/hawkers`)
            .pipe(
                tap(_=>console.log('fetched hawkers list')),
                    catchError(this.handleError<string[]>('getHawkers', []))
            )
    }

    private handleError<T>(operation = 'operations', result?: T){
        return (error: any): Observable<T> => {
            console.error(error)
            return of(result as T)
        }
    }
}