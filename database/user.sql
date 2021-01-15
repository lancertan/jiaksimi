drop database if exists fsd2020;

create database fsd2020;

use fsd2020;

create table user (
	user_id varchar(64) not null,
	password varchar(64) not null,
	primary key(user_id)
);

insert into user(user_id, password) values
	('fred', sha1('fred')),
	('wilma', sha1('wilma')),
	('barney', sha1('barney')),
	('betty', sha1('betty'));