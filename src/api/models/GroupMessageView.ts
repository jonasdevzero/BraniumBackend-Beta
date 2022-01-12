import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { GroupMessage, User } from '.';

@Entity('group_message_view')
export default class GroupMessageView extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unsigned: true })
    message_id: string;

    @Column({ default: true, unsigned: true })
    viewed: boolean;

    @Column()
    viewed_at: Date;

    @Column({ type: 'uuid', unsigned: true })
    viewer_id: string;

    @ManyToOne(_ => GroupMessage, message => message.views, {
        cascade: ['update', 'remove']
    })
    @JoinColumn({ name: 'message_id' })
    message: GroupMessage;

    @ManyToOne(_ => User, user => user.group_messages_viewed, {
        cascade: ['update', 'remove']
    })
    @JoinColumn({ name: 'viewer_id' })
    viewer: User;
}
