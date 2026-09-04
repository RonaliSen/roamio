alter table destinations add column region text not null default 'Europe';

update destinations set region = 'Asia' where slug = 'kyoto';
update destinations set region = 'Africa' where slug = 'marrakech';
-- prague, lisbon, amalfi, reykjavik keep the 'Europe' default
