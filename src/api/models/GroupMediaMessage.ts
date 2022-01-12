import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm'
import { GroupMessage } from '.';

@Entity('group_media_message')
export default class GroupmediaMessage extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    message_id: string;

    @Column()
    url: string;

    @Column()
    type: string;

    @ManyToOne(_ => GroupMessage, message => message.medias, {
        cascade: ['update', 'remove'],
    })
    @JoinColumn({ name: 'message_id' })
    message: GroupMessage;
}