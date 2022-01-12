import {
    Entity,
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Group, User, GroupMessageView, GroupMediaMessage } from '.';

@Entity('group_message')
export default class GroupMessage extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unsigned: true })
    group_id: string;

    @Column({ type: 'uuid', unsigned: true })
    sender_id: string;

    @Column({ nullable: true, unsigned: true })
    text: string;

    @Column({ unsigned: true })
    created_at: Date;

    @ManyToOne(_ => Group, group => group.messages, {
        cascade: ['update', 'remove'],
    })
    @JoinColumn({ name: 'group_id' })
    group: Group;

    @ManyToOne(_ => User, user => user.group_messages_sent, {
        cascade: ['update', 'remove'],
    })
    @JoinColumn({ name: 'group_id' })
    sender: User;

    @OneToMany(_ => GroupMediaMessage, media => media.message)
    @JoinColumn({ name: 'message_id' })
    medias: GroupMediaMessage[];

    @OneToMany(_ => GroupMessageView, view => view.message)
    @JoinColumn({ name: 'message_id' })
    views: GroupMessageView[];
}
