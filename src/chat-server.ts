import * as express from 'express';
import { createServer, Server } from 'http'; //new
import * as socketIo from 'socket.io'; // new
import { Socket } from 'net';
const fs = require('fs');

export class ChatServer {
	public static readonly PORT: number = 5000;
	private app: express.Application;
	private port: string | number;
	private server: Server; // new
	private io: socketIo.Server;
	private socketsArray = [];
	constructor() {
		this.createApp();
		this.config();
		this.createServer();
		this.sockets(); // new
		this.listen();
	}
	private sockets(): void {
		this.io = socketIo(this.server);
	}
	private createApp(): void {
		this.app = express();
		this.app.use(express.static('public'));
	}

	private config(): void {
		this.port = process.env.PORT || ChatServer.PORT;
	}

	private listen(): void {
		this.server.listen(this.port, () => {
			console.log('Running server on port %s', this.port);
		});
		this.io.on('connection', (socket) => {
			socket.broadcast.emit('add-users', {
				users: [ socket.id ]
			});

			socket.on('disconnect', () => {
				this.socketsArray.splice(this.socketsArray.indexOf(socket.id), 1);
				this.io.emit('remove-user', socket.id);
			});
			socket.on('make-offer', function(data) {
				socket.to(data.to).emit('offer-made', {
					offer: data.offer,
					socket: socket.id
				});
			});
			socket.on('make-answer', function(data) {
				socket.to(data.to).emit('answer-made', {
					socket: socket.id,
					answer: data.answer
				});
			});
		});
	}

	// new
	private createServer(): void {
		const options = {
			key: fs.readFileSync('key.pem'),
			cert: fs.readFileSync('cert.pem')
		};
		this.server = createServer(
			// options,
			this.app
		);
	}

	public getApp(): express.Application {
		return this.app;
	}
}
