import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
    providedIn: 'root'
})
export class MessageService implements OnDestroy {
    private apiUrl = 'http://localhost:8080/api/messages';
    private stompClient: Client | undefined;
    private messagesSubject = new Subject<any>();

    // Public observable for components to subscribe to
    public messages$ = this.messagesSubject.asObservable();

    constructor(private http: HttpClient, private zone: NgZone) { }

    private getHeaders(): HttpHeaders {
        const auth = sessionStorage.getItem('chatAuth') || '';
        return new HttpHeaders({
            'Authorization': auth,
            'Content-Type': 'application/json'
        });
    }

    getMessages(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
    }

    postMessage(content: string): Observable<any> {
        return this.http.post<any>(this.apiUrl, { content }, { headers: this.getHeaders() });
    }

    login(authHeader: string): Observable<any> {
        const headers = new HttpHeaders({
            'Authorization': authHeader
        });
        return this.http.get<any[]>(this.apiUrl, { headers });
    }

    connect() {
        if (this.stompClient && this.stompClient.active) {
            return;
        }

        this.stompClient = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            debug: (str) => {
                console.log(str);
            }
        });

        this.stompClient.onConnect = (frame) => {
            console.log('Connected: ' + frame);
            this.stompClient?.subscribe('/topic/messages', (message) => {
                if (message.body) {
                    const msg = JSON.parse(message.body);
                    this.zone.run(() => {
                        this.messagesSubject.next(msg);
                    });
                }
            });
        };

        this.stompClient.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        this.stompClient.activate();
    }

    disconnect() {
        if (this.stompClient) {
            this.stompClient.deactivate();
        }
    }

    ngOnDestroy() {
        this.disconnect();
    }
}
